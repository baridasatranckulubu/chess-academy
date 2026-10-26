-- Manual admin reminders do not change automatic inactivity eligibility or timing.
create table barida_push.manual_requests(
 request_id uuid primary key, admin_id uuid not null references public.profiles(id),
 sent_at timestamptz not null default now(), recipient_count integer not null default 0
);
alter table barida_push.manual_requests enable row level security;
grant all on barida_push.manual_requests to service_role;
create or replace function barida_push.manual_training_reminder(p_request uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();n integer;begin
 if uid is null or not exists(select 1 from public.profiles where id=uid and role='admin') then raise exception 'Yönetici yetkisi gerekli';end if;
 if p_request is null then raise exception 'İstek kimliği gerekli';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request::text,0));
 select recipient_count into n from barida_push.manual_requests where request_id=p_request and admin_id=uid;
 if found then return n;end if;
 insert into barida_push.manual_requests(request_id,admin_id) values(p_request,uid);
 insert into public.academy_notifications(recipient_id,sender_id,category,title,body,reference_key)
 select p.id,uid,'training_reminder','Küçük bir satranç molasına ne dersin? ♟️',
 'Antrenman zamanı! Bugün birkaç soru çözerek kendini geliştirebilirsin. Barida’da tahta seni bekliyor.',
 'manual-training:'||p_request::text from public.profiles p
 where p.role='student' and not exists(select 1 from public.academy_student_status s where s.student_id=p.id and not s.active);
 get diagnostics n=row_count;
 update barida_push.manual_requests set recipient_count=n where request_id=p_request;
 return n;
end $$;
revoke all on function barida_push.manual_training_reminder(uuid) from public,anon;
grant usage on schema barida_push to authenticated;
grant execute on function barida_push.manual_training_reminder(uuid) to authenticated;
create or replace function public.academy_send_training_reminder(p_request uuid)
returns integer language sql security invoker set search_path='' as $$
 select barida_push.manual_training_reminder(p_request);
$$;
revoke all on function public.academy_send_training_reminder(uuid) from public,anon;
grant execute on function public.academy_send_training_reminder(uuid) to authenticated;
-- Stable daily random minute per student: never resampled by retries or manual sends.
create or replace function barida_push.inactive_students(p_now timestamptz default now())
returns table(user_id uuid) language sql security invoker set search_path='' as $$
 select p.id from public.profiles p
 join (select user_id,max(updated_at) seen from public.academy_push_devices where updated_at>p_now-interval '90 days' group by user_id) d on d.user_id=p.id
 left join (select user_id,max(updated_at) seen from public.barida_site_sessions group by user_id) s on s.user_id=p.id
 left join barida_push.reminder_state r on r.user_id=p.id
 where p.role='student' and greatest(d.seen,coalesce(s.seen,d.seen))<=p_now-interval '24 hours'
 and (r.last_sent_at is null or (r.last_sent_at at time zone 'Europe/Istanbul')::date < (p_now at time zone 'Europe/Istanbul')::date)
 and (p_now at time zone 'Europe/Istanbul')::time >= time '09:00'+make_interval(mins=>abs((hashtextextended(p.id::text||(p_now at time zone 'Europe/Istanbul')::date::text,0)%144)::integer)*5)
 and (p_now at time zone 'Europe/Istanbul')::time < time '21:00'
 and not exists(select 1 from public.academy_student_status a where a.student_id=p.id and a.active=false);
$$;
select cron.schedule('barida-inactivity-reminder','*/5 * * * *',$cron$select barida_push.send_inactivity_reminders();$cron$);
