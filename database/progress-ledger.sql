create table public.academy_training_attempts(
 user_id uuid not null references public.profiles(id) on delete cascade,
 source text not null check(source in ('puzzle','tactic','legacy')),
 item_id text not null check(length(item_id) between 1 and 100),
 success boolean not null,created_at timestamptz not null default now(),
 primary key(user_id,source,item_id)
);
alter table public.academy_training_attempts enable row level security;
create policy training_own_read on public.academy_training_attempts for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.academy_training_attempts from anon,authenticated;
grant select on public.academy_training_attempts to authenticated;
create function public.academy_refresh_progress(p_user uuid) returns void language plpgsql security definer set search_path='' as $$
declare q int;c int;begin
 select count(*),count(*) filter(where success) into q,c from public.academy_training_attempts where user_id=p_user;
 select q+count(*),c+count(*) filter(where success and wrong_moves=0) into q,c from public.academy_assignment_attempts where student_id=p_user and finished;
 insert into public.student_progress(user_id,questions_answered,correct_answers,completed_lessons) values(p_user,q,c,'[]')
 on conflict(user_id) do update set questions_answered=greatest(public.student_progress.questions_answered,excluded.questions_answered),correct_answers=greatest(public.student_progress.correct_answers,excluded.correct_answers),updated_at=now();
end $$;
revoke all on function public.academy_refresh_progress(uuid) from public,anon,authenticated;
create function public.academy_record_training(p_source text,p_item text,p_success boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();added int;begin
 if uid is null or not exists(select 1 from public.profiles where id=uid and role='student') then raise exception 'Sporcu oturumu gerekli';end if;
 if exists(select 1 from public.academy_student_status where student_id=uid and not active) then raise exception 'Hesap pasif';end if;
 if p_source not in ('puzzle','tactic','legacy') or p_item !~ '^[a-zA-Z0-9:_-]{1,100}$' or p_success is null then raise exception 'Geçersiz sonuç';end if;
 if p_source='puzzle' and exists(select 1 from public.academy_assignment_attempts where student_id=uid and puzzle_id=p_item and finished) then perform public.academy_refresh_progress(uid);return jsonb_build_object('recorded',false,'already_assignment',true);end if;
 insert into public.academy_training_attempts(user_id,source,item_id,success) values(uid,p_source,p_item,p_success) on conflict do nothing;
 get diagnostics added=row_count;
 if added=1 then insert into public.barida_rating_events(student_id,puzzle_id,event_key,delta,reason) values(uid,p_item,'training:'||uid||':'||p_source||':'||p_item,case when p_success then 5 else -15 end,'Taktik sonucu') on conflict(event_key) do nothing;end if;
 perform public.academy_refresh_progress(uid);
 return jsonb_build_object('recorded',added=1);
end $$;
revoke all on function public.academy_record_training(text,text,boolean) from public,anon;
grant execute on function public.academy_record_training(text,text,boolean) to authenticated;
create or replace function public.barida_rating_attempt_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.finished then
 insert into public.barida_rating_events(student_id,assignment_id,puzzle_id,event_key,delta,reason)
 values(new.student_id,new.assignment_id,new.puzzle_id,'attempt:'||new.id::text,case when new.success and new.wrong_moves=0 then 5 else -15 end,'Ödev sorusu') on conflict(event_key) do nothing;
 perform public.academy_refresh_progress(new.student_id);
 end if;return new;
end $$;
revoke all on function public.barida_rating_attempt_event() from public,anon,authenticated;
create or replace function public.barida_rating_dashboard() returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;uid uuid:=auth.uid();begin
 if uid is null then raise exception 'Oturum gerekli';end if;
 perform public.barida_rating_close_month(false);perform public.academy_refresh_progress(uid);
 select jsonb_build_object('champions',coalesce((select jsonb_agg(to_jsonb(x) order by x.position) from (select position,student_name,points,month_start from public.barida_rating_champions where month_start=(select max(month_start) from public.barida_rating_champions)) x),'[]'::jsonb),
 'solved',coalesce((select questions_answered from public.student_progress where user_id=uid),0),
 'correct',coalesce((select correct_answers from public.student_progress where user_id=uid),0),
 'assignments_total',(select count(*) from public.academy_assignments where student_id=uid),
 'assignments_done',(select count(*) from public.academy_assignments where student_id=uid and status='completed')) into result;return result;
end $$;
-- Existing completed assignments are reconciled; existing event keys prevent duplicates.
insert into public.barida_rating_events(student_id,assignment_id,puzzle_id,event_key,delta,reason)
select student_id,assignment_id,puzzle_id,'attempt:'||id::text,case when success and wrong_moves=0 then 5 else -15 end,'Ödev sorusu' from public.academy_assignment_attempts where finished on conflict(event_key) do nothing;
do $$ declare uid uuid;begin for uid in select id from public.profiles where role='student' loop perform public.academy_refresh_progress(uid);end loop;end $$;
create function public.academy_merge_progress(p_completed jsonb) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();begin
 if uid is null or not exists(select 1 from public.profiles where id=uid and role='student') then raise exception 'Sporcu oturumu gerekli';end if;
 if jsonb_typeof(p_completed)<>'array' or jsonb_array_length(p_completed)>500 then raise exception 'Geçersiz kayıt';end if;
 insert into public.student_progress(user_id,completed_lessons,questions_answered,correct_answers) values(uid,p_completed,0,0)
 on conflict(user_id) do update set completed_lessons=(select coalesce(jsonb_agg(distinct value),'[]') from jsonb_array_elements(public.student_progress.completed_lessons||excluded.completed_lessons)),updated_at=now();
 perform public.academy_refresh_progress(uid);
end $$;
revoke all on function public.academy_merge_progress(jsonb) from public,anon;
grant execute on function public.academy_merge_progress(jsonb) to authenticated;
