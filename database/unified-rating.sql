-- One Rating ledger for puzzles, homework, ranking and all nine tiers.
-- Question difficulty follows the canonical Rating and configured highest tier boundary.
-- Historical puzzle points are already in the ledger; do not add them twice.
create or replace function public.barida_puzzle_result(p_item text default null,p_success boolean default null,p_rating integer default 1100) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();points_before int;points_after int;top_boundary int;result jsonb;begin
if uid is null or not exists(select 1 from public.profiles where id=uid and role='student') then raise exception 'Sporcu oturumu gerekli';end if;
perform public.barida_rating_close_month(false);
insert into public.barida_rating_accounts(student_id,points) values(uid,0) on conflict do nothing;
select points into points_before from public.barida_rating_accounts where student_id=uid for update;
if p_item is not null then
 if p_rating is null or p_rating not between 400 and 3500 then raise exception 'Geçersiz soru seviyesi';end if;
 result:=public.academy_record_training('puzzle',p_item,p_success);
end if;
select points into points_after from public.barida_rating_accounts where student_id=uid;
select greatest(1,(tiers->8->>'min')::integer) into top_boundary from public.barida_rating_config where id=true;
return jsonb_build_object('rating',points_after,'delta',points_after-points_before,
'difficulty',400+least(2600,floor(greatest(0,points_after)::numeric*2600/coalesce(top_boundary,8000)))::integer,
'recorded',coalesce((result->>'recorded')::boolean,false));
end $$;
revoke all on function public.barida_puzzle_result(text,boolean,integer) from public,anon;
grant execute on function public.barida_puzzle_result(text,boolean,integer) to authenticated;
CREATE OR REPLACE FUNCTION public.barida_student_summary(p_student uuid DEFAULT NULL::uuid, p_session uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid:=auth.uid();target uuid:=coalesce(p_student,auth.uid());r text;result jsonb;begin
select role into r from public.profiles where id=uid;
if uid is null or r is null or not (r='admin' or (r='student' and target=uid) or (r='teacher' and exists(select 1 from public.teacher_students where teacher_id=uid and student_id=target))) then raise exception 'Yetkisiz';end if;
if not exists(select 1 from public.profiles where id=target and role='student') then raise exception 'Sporcu seçin';end if;
perform public.barida_rating_close_month(false);
perform public.academy_refresh_progress(target);
select jsonb_build_object('student_id',p.id,'student_name',p.display_name,
'rating',coalesce((select points from public.barida_rating_accounts where student_id=p.id),0),
'puzzle_elo',coalesce((select points from public.barida_rating_accounts where student_id=p.id),0),
'club_rating',coalesce((select points from public.barida_rating_accounts where student_id=p.id),0),
'solved',coalesce(s.questions_answered,0),'correct',coalesce(s.correct_answers,0),
'assignments_total',(select count(*) from public.academy_assignments where student_id=p.id),
'assignments_done',(select count(*) from public.academy_assignments where student_id=p.id and status='completed'),
'assignments',coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at desc) from (select id,title,kind,puzzle_count,status,created_at,due_at from public.academy_assignments where student_id=p.id order by created_at desc limit 5) a),'[]'::jsonb),
'site_seconds',(select coalesce(sum(seconds),0) from public.barida_site_sessions where user_id=p.id),
'session_seconds',coalesce((select seconds from public.barida_site_sessions where id=p_session and user_id=p.id),0))
into result from public.profiles p left join public.student_progress s on s.user_id=p.id where p.id=target;return result;end $function$

