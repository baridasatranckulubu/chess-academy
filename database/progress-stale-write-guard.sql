create function public.academy_progress_monotonic() returns trigger language plpgsql security definer set search_path='' as $$
declare q int;c int;begin
 select count(*),count(*) filter(where success) into q,c from public.academy_training_attempts where user_id=new.user_id;
 select q+count(*),c+count(*) filter(where success and wrong_moves=0) into q,c from public.academy_assignment_attempts where student_id=new.user_id and finished;
 new.questions_answered:=greatest(coalesce(new.questions_answered,0),q);
 new.correct_answers:=greatest(coalesce(new.correct_answers,0),c);
 if tg_op='UPDATE' then new.questions_answered:=greatest(new.questions_answered,old.questions_answered);new.correct_answers:=greatest(new.correct_answers,old.correct_answers);end if;
 return new;
end $$;
revoke all on function public.academy_progress_monotonic() from public,anon,authenticated;
create trigger academy_progress_stale_guard before insert or update of questions_answered,correct_answers on public.student_progress for each row execute function public.academy_progress_monotonic();
