alter table public.user_preferences add column if not exists welcome_seen_at timestamptz;
CREATE OR REPLACE FUNCTION public.barida_rating_close_month(p_force boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare current_month date:=date_trunc('month',now() at time zone 'Europe/Istanbul')::date; active_month date; caller uuid:=auth.uid();
begin
 perform pg_advisory_xact_lock(81254037);
 if p_force and not exists(select 1 from public.profiles where id=caller and role='admin') then raise exception 'Yalnızca yönetici sıfırlayabilir';end if;
 select month_start into active_month from public.barida_rating_months where closed_at is null order by month_start limit 1 for update;
 if active_month is null then insert into public.barida_rating_months(month_start) values(current_month) on conflict do nothing;return;end if;
 if not p_force and active_month>=current_month then return;end if;
 insert into public.barida_rating_champions(month_start,position,student_id,student_name,points)
 select active_month,ranking.pos,ranking.id,ranking.display_name,ranking.points from
 (select p.id,coalesce(nullif(p.display_name,''),p.username) display_name,coalesce(r.points,0) points,row_number() over(order by coalesce(r.points,0) desc,p.id) pos
 from public.profiles p left join public.barida_rating_accounts r on r.student_id=p.id where p.role='student') ranking where ranking.pos<=3
 on conflict(month_start,position) do update set student_id=excluded.student_id,student_name=excluded.student_name,points=excluded.points;
 update public.barida_rating_months set closed_at=now(),closed_by=caller where month_start=active_month;
 update public.barida_rating_accounts set points=0,updated_at=now();
 insert into public.barida_rating_months(month_start) values(current_month) on conflict(month_start) do update set closed_at=null,closed_by=null;
end $function$
;
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
end $function$
;
CREATE OR REPLACE FUNCTION public.barida_rating_leaderboard()
 RETURNS TABLE(student_id uuid, student_name text, points integer, rank bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select p.id,coalesce(nullif(p.display_name,''),p.username),coalesce(r.points,0),rank() over(order by coalesce(r.points,0) desc) from public.profiles p left join public.barida_rating_accounts r on r.student_id=p.id where p.role='student' and auth.uid() is not null order by 4,2 limit 200
$function$
;
CREATE OR REPLACE FUNCTION public.barida_rating_set_champion(p_position integer, p_student uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare m date; student text; pts int;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Yetkisiz';end if;
 if p_position not between 1 and 3 then raise exception 'Sıra 1-3 olmalı';end if;
 select max(month_start) into m from public.barida_rating_champions;
 if m is null then raise exception 'Henüz tamamlanan ay yok';end if;
 select coalesce(nullif(display_name,''),username) into student from public.profiles where id=p_student and role='student';
 if student is null then raise exception 'Sporcu bulunamadı';end if;
 select coalesce(points,0) into pts from public.barida_rating_accounts where student_id=p_student;
 insert into public.barida_rating_champions(month_start,position,student_id,student_name,points) values(m,p_position,p_student,student,coalesce(pts,0))
 on conflict(month_start,position) do update set student_id=excluded.student_id,student_name=excluded.student_name,points=excluded.points;
end $function$
;

