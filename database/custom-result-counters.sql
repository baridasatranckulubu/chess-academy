create or replace function public.submit_academy_custom_board_answer(p_assignment_id uuid,p_move text) returns boolean language plpgsql security definer set search_path='' as $$
declare a public.academy_assignments%rowtype;ok boolean;begin
if auth.uid() is null then raise exception 'Oturum gerekli';end if;
select * into a from public.academy_assignments where id=p_assignment_id and student_id=auth.uid() and kind='position' for update;
if not found then raise exception 'Ödev bulunamadı';end if;
if p_move !~ '^[a-h][1-8][a-h][1-8][qrbn]?$' then raise exception 'Geçersiz hamle';end if;
ok:=lower(p_move)=lower(a.solution_uci);
insert into public.academy_assignment_attempts(assignment_id,student_id,puzzle_id,success,finished,wrong_moves) values(a.id,auth.uid(),'custom',ok,ok,case when ok then 0 else 1 end)
on conflict(assignment_id,student_id,puzzle_id) do update set success=public.academy_assignment_attempts.success or excluded.success,finished=public.academy_assignment_attempts.finished or excluded.finished,wrong_moves=public.academy_assignment_attempts.wrong_moves+case when excluded.success or public.academy_assignment_attempts.finished then 0 else 1 end;
if ok then update public.academy_assignments set status='completed',completed_at=coalesce(completed_at,now()) where id=a.id;end if;return ok;end $$;
