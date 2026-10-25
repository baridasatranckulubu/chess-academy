alter table public.academy_assignments add column if not exists due_at timestamptz;
update public.academy_assignments set due_at=now()+interval '7 days' where due_at is null and status<>'completed';
alter table public.academy_assignments alter column due_at set default (now()+interval '7 days');
alter table public.teacher_students add column if not exists class_name text not null default 'A';
create index if not exists assignments_student_status on public.academy_assignments(student_id,status);
create index if not exists assignments_due on public.academy_assignments(due_at) where status<>'completed';
create or replace function public.barida_rating_attempt_event() returns trigger language plpgsql security definer set search_path='' as $$
begin if new.finished then perform public.academy_refresh_progress(new.student_id);end if;return new;end $$;
create function public.barida_assignment_points() returns trigger language plpgsql security definer set search_path='' as $$
begin if new.status='completed' and (tg_op='INSERT' or old.status is distinct from 'completed') then
insert into public.barida_rating_events(student_id,assignment_id,event_key,delta,reason) values(new.student_id,new.id,'assignment-complete:'||new.id,10,'Ödev tamamlandı') on conflict(event_key) do nothing;end if;return new;end $$;
revoke all on function public.barida_assignment_points() from public,anon,authenticated;
create trigger assignment_completion_points after insert or update of status on public.academy_assignments for each row execute function public.barida_assignment_points();
create function public.barida_assignment_due_points() returns void language plpgsql security definer set search_path='' as $$
begin insert into public.barida_rating_events(student_id,assignment_id,event_key,delta,reason)
select a.student_id,a.id,'assignment-overdue:'||a.id,-50,'Süresinde tamamlanmayan ödev' from public.academy_assignments a where a.status<>'completed' and a.due_at<now() and exists(select 1 from public.profiles p where p.id=a.student_id and p.role='student') on conflict(event_key) do nothing;end $$;
revoke all on function public.barida_assignment_due_points() from public,anon,authenticated;
select cron.schedule('barida-assignment-deadlines','15 * * * *','select public.barida_assignment_due_points()');
select cron.schedule('barida-rating-monthly-reset','5 0 * * *','select public.barida_rating_close_month(false)');

create or replace function public.academy_record_training(p_source text,p_item text,p_success boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();added int;begin
if uid is null or not exists(select 1 from public.profiles where id=uid and role='student') then raise exception 'Sporcu oturumu gerekli';end if;
if exists(select 1 from public.academy_student_status where student_id=uid and not active) then raise exception 'Hesap pasif';end if;
if p_source not in ('puzzle','tactic','legacy') or p_item !~ '^[a-zA-Z0-9:_-]{1,100}$' or p_success is null then raise exception 'Geçersiz sonuç';end if;
if p_source='puzzle' and exists(select 1 from public.academy_assignment_attempts where student_id=uid and puzzle_id=p_item and finished) then return jsonb_build_object('recorded',false,'already_assignment',true);end if;
insert into public.academy_training_attempts(user_id,source,item_id,success) values(uid,p_source,p_item,p_success) on conflict do nothing;get diagnostics added=row_count;
if added=1 then insert into public.barida_rating_events(student_id,puzzle_id,event_key,delta,reason) values(uid,p_item,'training:'||uid||':'||p_source||':'||p_item,5,'Bulmaca çalışması') on conflict(event_key) do nothing;end if;
perform public.academy_refresh_progress(uid);return jsonb_build_object('recorded',added=1);end $$;

create table public.barida_puzzle_ratings(user_id uuid primary key references public.profiles(id) on delete cascade,rating int not null default 1100 check(rating between 400 and 3000),updated_at timestamptz not null default now());
alter table public.barida_puzzle_ratings enable row level security;revoke all on public.barida_puzzle_ratings from anon,authenticated;
create function public.barida_puzzle_result(p_item text default null,p_success boolean default null,p_rating int default 1100) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();b int;a int;result jsonb;begin
if uid is null or not exists(select 1 from public.profiles where id=uid and role='student') then raise exception 'Sporcu oturumu gerekli';end if;
insert into public.barida_puzzle_ratings(user_id) values(uid) on conflict do nothing;
select rating into b from public.barida_puzzle_ratings where user_id=uid for update;a:=b;
if p_item is not null then
if p_rating not between 400 and 3500 then raise exception 'Geçersiz soru seviyesi';end if;
result:=public.academy_record_training('puzzle',p_item,p_success);
if (result->>'recorded')::boolean then a:=greatest(400,least(3000,round(b+28*((case when p_success then 1 else 0 end)-1/(1+power(10::numeric,(p_rating-b)::numeric/400))))::int));update public.barida_puzzle_ratings set rating=a,updated_at=now() where user_id=uid;end if;end if;
return jsonb_build_object('rating',a,'delta',a-b,'recorded',coalesce((result->>'recorded')::boolean,false));end $$;
revoke all on function public.barida_puzzle_result(text,boolean,int) from public,anon;grant execute on function public.barida_puzzle_result(text,boolean,int) to authenticated;

create function public.barida_club_roster() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();r text;result jsonb;begin
select role into r from public.profiles where id=uid;if uid is null or r not in ('teacher','admin') then raise exception 'Yetkisiz';end if;
select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.display_name,'user',p.username,'createdAt',p.created_at,'progress',jsonb_build_object('completed_lessons',coalesce(s.completed_lessons,'[]'::jsonb),'questions_answered',coalesce(s.questions_answered,0),'correct_answers',coalesce(s.correct_answers,0)),'classes',coalesce((select jsonb_agg(jsonb_build_object('teacher_id',ts.teacher_id,'class_name',ts.class_name)) from public.teacher_students ts where ts.student_id=p.id),'[]'::jsonb),'assignments_total',(select count(*) from public.academy_assignments a where a.student_id=p.id),'assignments_done',(select count(*) from public.academy_assignments a where a.student_id=p.id and a.status='completed')) order by p.display_name),'[]'::jsonb) into result from public.profiles p left join public.student_progress s on s.user_id=p.id where p.role='student' and (r='admin' or exists(select 1 from public.teacher_students t where t.student_id=p.id and t.teacher_id=uid));return result;end $$;
revoke all on function public.barida_club_roster() from public,anon;grant execute on function public.barida_club_roster() to authenticated;
create function public.barida_class_assign(p_student uuid,p_teacher uuid,p_class text) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();r text;begin select role into r from public.profiles where id=uid;
if uid is null or r not in ('admin','teacher') or (r='teacher' and (p_teacher<>uid or not exists(select 1 from public.teacher_students where student_id=p_student and teacher_id=uid))) then raise exception 'Yetkisiz';end if;
if length(trim(p_class)) not between 1 and 40 or not exists(select 1 from public.profiles where id=p_student and role='student') or not exists(select 1 from public.profiles where id=p_teacher and role='teacher') then raise exception 'Antrenör, sporcu veya sınıf geçersiz';end if;
insert into public.teacher_students(teacher_id,student_id,class_name) values(p_teacher,p_student,trim(p_class)) on conflict(teacher_id,student_id) do update set class_name=excluded.class_name;end $$;
revoke all on function public.barida_class_assign(uuid,uuid,text) from public,anon;grant execute on function public.barida_class_assign(uuid,uuid,text) to authenticated;
create or replace function public.barida_rating_set_champion(p_position int,p_student uuid) returns void language plpgsql security definer set search_path='' as $$
declare m date:=date_trunc('month',now() at time zone 'Europe/Istanbul')::date;n text;pts int;begin
if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Yetkisiz';end if;
if p_position not between 1 and 3 then raise exception 'Sıra 1-3 olmalı';end if;
if p_student is null then delete from public.barida_rating_champions where month_start=m and position=p_position;return;end if;
select display_name into n from public.profiles where id=p_student and role='student';if n is null then raise exception 'Sporcu bulunamadı';end if;
select coalesce(points,0) into pts from public.barida_rating_accounts where student_id=p_student;
delete from public.barida_rating_champions where month_start=m and student_id=p_student and position<>p_position;
insert into public.barida_rating_champions(month_start,position,student_id,student_name,points) values(m,p_position,p_student,n,coalesce(pts,0)) on conflict(month_start,position) do update set student_id=excluded.student_id,student_name=excluded.student_name,points=excluded.points;end $$;

CREATE OR REPLACE FUNCTION public.barida_rating_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare result jsonb;uid uuid:=auth.uid();begin
 if uid is null then raise exception 'Oturum gerekli';end if;
 perform public.barida_rating_close_month(false);perform public.academy_refresh_progress(uid);
 select jsonb_build_object('champions',coalesce((select jsonb_agg(to_jsonb(x) order by x.position) from (select position,student_name,points,month_start from public.barida_rating_champions where exists(select 1 from public.profiles p where p.id=barida_rating_champions.student_id and p.role='student') and month_start=(select max(month_start) from public.barida_rating_champions)) x),'[]'::jsonb),
 'solved',coalesce((select questions_answered from public.student_progress where user_id=uid),0),
 'correct',coalesce((select correct_answers from public.student_progress where user_id=uid),0),
 'assignments_total',(select count(*) from public.academy_assignments where student_id=uid),
 'assignments_done',(select count(*) from public.academy_assignments where student_id=uid and status='completed')) into result;return result;
end $function$;
CREATE OR REPLACE FUNCTION public.barida_rating_admin_reset()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_before bigint; v_after bigint; v_champions int; v_month date;
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Yönetici yetkisi gerekli';end if;
 perform pg_advisory_xact_lock(81254037);
 select coalesce(sum(points),0) into v_before from public.barida_rating_accounts;
 select date_trunc('month',now() at time zone 'Europe/Istanbul')::date into v_month;
 insert into public.barida_rating_champions(month_start,position,student_id,student_name,points)
 select v_month,pos,id,student_name,points from
 (select p.id,coalesce(nullif(p.display_name,''),p.username) student_name,coalesce(a.points,0) points,row_number() over(order by coalesce(a.points,0) desc,p.id) pos
 from public.profiles p left join public.barida_rating_accounts a on a.student_id=p.id where p.role='student') x where pos<=3
 on conflict(month_start,position) do update set student_id=excluded.student_id,student_name=excluded.student_name,points=excluded.points;
 update public.barida_rating_accounts set points=0,updated_at=now() where points<>0;
 select coalesce(sum(points),0) into v_after from public.barida_rating_accounts;
 select count(*) into v_champions from public.barida_rating_champions where month_start=v_month;
 return jsonb_build_object('before',v_before,'after',v_after,'champions',v_champions);
end $function$;
create table public.barida_coordinate_runs(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,started_at timestamptz not null default clock_timestamp(),duration int not null check(duration between 60 and 600 and duration%60=0),score int check(score between 0 and 1000),finished_at timestamptz);
alter table public.barida_coordinate_runs enable row level security;revoke all on public.barida_coordinate_runs from anon,authenticated;
create index coordinate_leaderboard on public.barida_coordinate_runs(duration,score desc) where finished_at is not null;
create function public.barida_coordinates(p_action text,p_duration int default 60,p_run uuid default null,p_score int default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();run public.barida_coordinate_runs%rowtype;result jsonb;begin
if uid is null then raise exception 'Oturum gerekli';end if;
if p_action='start' then
if not exists(select 1 from public.profiles where id=uid and role='student') or exists(select 1 from public.academy_student_status where student_id=uid and not active) then raise exception 'Aktif sporcu oturumu gerekli';end if;
insert into public.barida_coordinate_runs(user_id,duration) values(uid,p_duration) returning * into run;return jsonb_build_object('id',run.id);
elsif p_action='finish' then
select * into run from public.barida_coordinate_runs where id=p_run and user_id=uid for update;
if not found or run.finished_at is not null then raise exception 'Yarışma bulunamadı veya kaydedildi';end if;
if clock_timestamp()<run.started_at+make_interval(secs=>run.duration) or clock_timestamp()>run.started_at+make_interval(secs=>run.duration+30) or p_score is null or p_score<0 or p_score>run.duration*8 then raise exception 'Geçersiz süre veya puan';end if;
update public.barida_coordinate_runs set score=p_score,finished_at=clock_timestamp() where id=run.id;
elsif p_action<>'board' then raise exception 'Geçersiz işlem';end if;
select coalesce(jsonb_agg(to_jsonb(x) order by x.score desc,x.student_name),'[]'::jsonb) into result from (
select p.id student_id,p.display_name student_name,max(c.score) score from public.barida_coordinate_runs c join public.profiles p on p.id=c.user_id where c.duration=60 and c.finished_at is not null and p.role='student' group by p.id,p.display_name order by max(c.score) desc,p.display_name limit 50) x;return result;end $$;
revoke all on function public.barida_coordinates(text,int,uuid,int) from public,anon;grant execute on function public.barida_coordinates(text,int,uuid,int) to authenticated;
