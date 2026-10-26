-- A daily reminder after 24 hours without foreground activity (Europe/Istanbul daytime).
alter table public.academy_notifications drop constraint academy_notifications_category_check;
alter table public.academy_notifications add constraint academy_notifications_category_check
 check(category in ('message','assignment_new','assignment_done','payment','training_reminder'));
create table barida_push.reminder_state(
 user_id uuid primary key references public.profiles(id) on delete cascade,
 last_sent_at timestamptz not null
);
alter table barida_push.reminder_state enable row level security;
grant all on barida_push.reminder_state to service_role;
create or replace function barida_push.inactive_students(p_now timestamptz default now())
returns table(user_id uuid) language sql security invoker set search_path='' as $$
 select p.id from public.profiles p
 join (select user_id,max(updated_at) seen from public.academy_push_devices where updated_at>p_now-interval '90 days' group by user_id) d on d.user_id=p.id
 left join (select user_id,max(updated_at) seen from public.barida_site_sessions group by user_id) s on s.user_id=p.id
 left join barida_push.reminder_state r on r.user_id=p.id
 where p.role='student' and greatest(d.seen,coalesce(s.seen,d.seen))<=p_now-interval '24 hours'
 and (r.last_sent_at is null or r.last_sent_at<=p_now-interval '24 hours')
 and not exists(select 1 from public.academy_student_status a where a.student_id=p.id and a.active=false);
$$;
revoke all on function barida_push.inactive_students(timestamptz) from public,anon,authenticated;
create or replace function barida_push.send_inactivity_reminders() returns integer
language plpgsql security definer set search_path='' as $$
declare u record;n integer:=0;begin
 if extract(hour from now() at time zone 'Europe/Istanbul') not between 9 and 20 then return 0;end if;
 if not pg_try_advisory_xact_lock(803224155) then return 0;end if;
 for u in select user_id from barida_push.inactive_students() limit 500 loop
  insert into public.academy_notifications(recipient_id,category,title,body)
  values(u.user_id,'training_reminder','Tahta seni bekliyor ♟️','Bir süredir görüşemedik. Bugün birkaç dakikanı satranca ayırmaya ne dersin? Birkaç soru çözerek kaldığın yerden devam edebilirsin.');
  insert into barida_push.reminder_state(user_id,last_sent_at) values(u.user_id,now())
  on conflict(user_id) do update set last_sent_at=excluded.last_sent_at;
  n:=n+1;
 end loop;return n;
end $$;
revoke all on function barida_push.send_inactivity_reminders() from public,anon,authenticated;
select cron.schedule('barida-inactivity-reminder','*/10 * * * *',$cron$select barida_push.send_inactivity_reminders();$cron$);
