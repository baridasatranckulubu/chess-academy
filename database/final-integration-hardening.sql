-- Read paths and foreign-key checks used by homework, inbox, attendance and push delivery.
-- Additive only: no rows, account permissions or reminder schedules are changed.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
create index if not exists barida_attendance_student_date_idx on public.academy_attendance(student_id,class_date);
create index if not exists barida_notifications_assignment_idx on public.academy_notifications(assignment_id);
create index if not exists barida_notifications_sender_idx on public.academy_notifications(sender_id);
create index if not exists barida_reservations_assignment_idx on public.academy_student_puzzle_reservations(assignment_id);
create index if not exists barida_push_jobs_token_idx on barida_push.jobs(token);
commit;
