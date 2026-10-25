
create table public.barida_site_sessions(id uuid primary key,user_id uuid not null references public.profiles(id) on delete cascade,seconds integer not null default 0 check(seconds>=0),started_at timestamptz not null default clock_timestamp(),updated_at timestamptz not null default clock_timestamp());
alter table public.barida_site_sessions enable row level security;
revoke all on public.barida_site_sessions from anon,authenticated;
create index barida_site_sessions_user on public.barida_site_sessions(user_id);
create function public.barida_site_presence(p_session uuid,p_total integer) returns bigint language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();s public.barida_site_sessions%rowtype;begin
if uid is null or not exists(select 1 from public.profiles where id=uid) then raise exception 'Oturum gerekli';end if;
if p_session is null or p_total is null or p_total<0 then raise exception 'Geçersiz süre';end if;
insert into public.barida_site_sessions(id,user_id) values(p_session,uid) on conflict do nothing;
select * into s from public.barida_site_sessions where id=p_session for update;
if s.user_id<>uid then raise exception 'Yetkisiz';end if;
if p_total<s.seconds then return (select coalesce(sum(seconds),0) from public.barida_site_sessions where user_id=uid);end if;
if p_total-s.seconds>35 or p_total>extract(epoch from clock_timestamp()-s.started_at)+3 then raise exception 'Geçersiz süre artışı';end if;
update public.barida_site_sessions set seconds=p_total,updated_at=clock_timestamp() where id=p_session;
return (select coalesce(sum(seconds),0) from public.barida_site_sessions where user_id=uid);end $$;
revoke all on function public.barida_site_presence(uuid,integer) from public,anon;
grant execute on function public.barida_site_presence(uuid,integer) to authenticated;

create function public.barida_student_summary(p_student uuid default null,p_session uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();target uuid:=coalesce(p_student,auth.uid());r text;result jsonb;begin
select role into r from public.profiles where id=uid;
if uid is null or r is null or not (r='admin' or (r='student' and target=uid) or (r='teacher' and exists(select 1 from public.teacher_students where teacher_id=uid and student_id=target))) then raise exception 'Yetkisiz';end if;
if not exists(select 1 from public.profiles where id=target and role='student') then raise exception 'Sporcu seçin';end if;
perform public.barida_rating_close_month(false);
perform public.academy_refresh_progress(target);
select jsonb_build_object('student_id',p.id,'student_name',p.display_name,
'puzzle_elo',coalesce((select rating from public.barida_puzzle_ratings where user_id=p.id),1100),
'club_rating',coalesce((select points from public.barida_rating_accounts where student_id=p.id),0),
'solved',coalesce(s.questions_answered,0),'correct',coalesce(s.correct_answers,0),
'assignments_total',(select count(*) from public.academy_assignments where student_id=p.id),
'assignments_done',(select count(*) from public.academy_assignments where student_id=p.id and status='completed'),
'assignments',coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at desc) from (select id,title,kind,puzzle_count,status,created_at,due_at from public.academy_assignments where student_id=p.id order by created_at desc limit 5) a),'[]'::jsonb),
'site_seconds',(select coalesce(sum(seconds),0) from public.barida_site_sessions where user_id=p.id),
'session_seconds',coalesce((select seconds from public.barida_site_sessions where id=p_session and user_id=p.id),0))
into result from public.profiles p left join public.student_progress s on s.user_id=p.id where p.id=target;return result;end $$;
revoke all on function public.barida_student_summary(uuid,uuid) from public,anon;
grant execute on function public.barida_student_summary(uuid,uuid) to authenticated;

