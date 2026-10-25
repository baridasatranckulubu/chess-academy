create or replace function public.barida_rating_apply_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
-- Close the previous month before applying its first new-month result.
if (select coalesce(min(month_start),date '1970-01-01') from public.barida_rating_months where closed_at is null)<date_trunc('month',now() at time zone 'Europe/Istanbul')::date then perform public.barida_rating_close_month(false);end if;
insert into public.barida_rating_accounts(student_id,points) values(new.student_id,0) on conflict(student_id) do nothing;
update public.barida_rating_accounts set points=greatest(0,points+new.delta),updated_at=now() where student_id=new.student_id;return new;end $$;