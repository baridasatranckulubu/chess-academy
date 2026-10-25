CREATE OR REPLACE FUNCTION public.academy_record_training(p_source text, p_item text, p_success boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid:=auth.uid();added int;begin
if uid is null or not exists(select 1 from public.profiles where id=uid and role='student') then raise exception 'Sporcu oturumu gerekli';end if;
if exists(select 1 from public.academy_student_status where student_id=uid and not active) then raise exception 'Hesap pasif';end if;
if p_source not in ('puzzle','tactic','legacy') or p_item !~ '^[a-zA-Z0-9:_-]{1,100}$' or p_success is null then raise exception 'Geçersiz sonuç';end if;
if p_source='puzzle' and exists(select 1 from public.academy_assignment_attempts where student_id=uid and puzzle_id=p_item and finished) then return jsonb_build_object('recorded',false,'already_assignment',true);end if;
insert into public.academy_training_attempts(user_id,source,item_id,success) values(uid,p_source,p_item,p_success) on conflict do nothing;get diagnostics added=row_count;
if added=1 then insert into public.barida_rating_events(student_id,puzzle_id,event_key,delta,reason) values(uid,p_item,'training:'||uid||':'||p_source||':'||p_item,case when p_success then 5 else -5 end,'Bulmaca çalışması') on conflict(event_key) do nothing;end if;
perform public.academy_refresh_progress(uid);return jsonb_build_object('recorded',added=1);end $function$;
alter table public.academy_assignments alter column due_at drop default;
create or replace function public.barida_assignment_deadline(p_assignment uuid,p_due timestamptz default null) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();a public.academy_assignments%rowtype;r text;begin
select role into r from public.profiles where id=uid;
select * into a from public.academy_assignments where id=p_assignment for update;
if uid is null or not found or r is null or r not in ('admin','teacher') or (r='teacher' and a.teacher_id is distinct from uid) then raise exception 'Bu ödevin süresini değiştirme yetkiniz yok';end if;
update public.academy_assignments set due_at=p_due where id=a.id;
end $$;
revoke all on function public.barida_assignment_deadline(uuid,timestamptz) from public,anon;
grant execute on function public.barida_assignment_deadline(uuid,timestamptz) to authenticated;

