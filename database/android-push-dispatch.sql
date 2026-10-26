create extension if not exists pg_net with schema extensions;
create schema if not exists barida_push;
revoke all on schema barida_push from public,anon,authenticated;
grant usage on schema barida_push to service_role;
create table barida_push.auth_config(hash text not null);
alter table barida_push.auth_config enable row level security;
do $$ declare k text:=encode(extensions.gen_random_bytes(32),'hex'); begin
 perform vault.create_secret(k,'barida_push_dispatch_key');
 insert into barida_push.auth_config values(encode(extensions.digest(k,'sha256'),'hex'));
end $$;
create table barida_push.jobs(
 id bigint generated always as identity primary key,
 notification_id uuid not null references public.academy_notifications(id) on delete cascade,
 token text not null references public.academy_push_devices(token) on delete cascade,
 status text not null default 'pending', attempts integer not null default 0,
 next_at timestamptz not null default now(), created_at timestamptz not null default now(),
 lease uuid, code text, unique(notification_id,token)
);
alter table barida_push.jobs enable row level security;
create index push_jobs_pending on barida_push.jobs(next_at) where status in ('pending','retry','processing');
grant all on all tables in schema barida_push to service_role;
grant usage,select on all sequences in schema barida_push to service_role;
create function barida_push.invoke() returns bigint language plpgsql security definer set search_path='' as $$
declare request_id bigint;begin
 select net.http_post(url:='https://kbqupsfylankcjgtjzld.supabase.co/functions/v1/academy-push-dispatch',
 headers:=jsonb_build_object('Content-Type','application/json','x-barida-push-key',(select decrypted_secret from vault.decrypted_secrets where name='barida_push_dispatch_key')),
 body:='{}'::jsonb,timeout_milliseconds:=10000) into request_id;
 return request_id;
end $$;
revoke all on function barida_push.invoke() from public,anon,authenticated;
create function barida_push.enqueue() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into barida_push.jobs(notification_id,token)
 select new.id,d.token from public.academy_push_devices d
 join public.profiles p on p.id=d.user_id
 where d.user_id=new.recipient_id and d.updated_at>now()-interval '90 days'
 and (new.category!~* '^(payment|billing|fee)' or p.role='admin')
 and (p.role<>'student' or not exists(select 1 from public.academy_student_status s where s.student_id=p.id and not s.active));
 if found then
  begin perform barida_push.invoke();exception when others then null;end;
 end if;
 return new;
end $$;
revoke all on function barida_push.enqueue() from public,anon,authenticated;
create trigger barida_push_notification after insert on public.academy_notifications for each row execute function barida_push.enqueue();
create function public.academy_push_authorized(p_secret text) returns boolean language sql security invoker set search_path='' as $$
 select exists(select 1 from barida_push.auth_config where hash=encode(extensions.digest(p_secret,'sha256'),'hex'));
$$;
create function public.academy_claim_push_jobs() returns table(id bigint,lease uuid) language sql security invoker set search_path='' as $$
 with selected as(select j.id from barida_push.jobs j where j.status in ('pending','retry','processing') and j.next_at<=now() and j.attempts<6 and j.created_at>now()-interval '1 day' order by j.id for update skip locked limit 20)
 update barida_push.jobs j set status='processing',lease=gen_random_uuid(),attempts=j.attempts+1,next_at=now()+interval '3 minutes' from selected s where j.id=s.id returning j.id,j.lease;
$$;
create function public.academy_push_job_payload(p_job bigint,p_lease uuid) returns table(token text,title text,body text,notification_id text) language sql security invoker set search_path='' as $$
 select d.token,n.title,left(n.body,1500),n.id::text from barida_push.jobs j
 join public.academy_notifications n on n.id=j.notification_id
 join public.academy_push_devices d on d.token=j.token and d.user_id=n.recipient_id
 join public.profiles p on p.id=n.recipient_id
 where j.id=p_job and j.lease=p_lease and j.status='processing' and n.read_at is null
 and (n.category!~* '^(payment|billing|fee)' or p.role='admin')
 and (p.role<>'student' or not exists(select 1 from public.academy_student_status s where s.student_id=p.id and not s.active));
$$;
create function public.academy_finish_push_job(p_job bigint,p_lease uuid,p_status text,p_code text) returns void language plpgsql security invoker set search_path='' as $$
declare device text;begin
 if p_status not in ('sent','skipped','invalid','retry','failed') then raise exception 'invalid status';end if;
 update barida_push.jobs set status=case when p_status='retry' and attempts>=6 then 'failed' else p_status end,
 code=left(p_code,80),next_at=now()+make_interval(secs=>least(3600,30*power(2,attempts)::integer))
 where id=p_job and lease=p_lease and status='processing' returning token into device;
 if p_status='invalid' and device is not null then delete from public.academy_push_devices where token=device;end if;
end $$;
revoke all on function public.academy_push_authorized(text),public.academy_claim_push_jobs(),public.academy_push_job_payload(bigint,uuid),public.academy_finish_push_job(bigint,uuid,text,text) from public,anon,authenticated;
grant execute on function public.academy_push_authorized(text),public.academy_claim_push_jobs(),public.academy_push_job_payload(bigint,uuid),public.academy_finish_push_job(bigint,uuid,text,text) to service_role;
select cron.schedule('barida-push-retry','* * * * *',$cron$select barida_push.invoke() where exists(select 1 from barida_push.jobs where status in ('pending','retry','processing') and next_at<=now() and attempts<6 and created_at>now()-interval '1 day');$cron$);
select cron.schedule('barida-push-cleanup','17 3 * * *',$cron$delete from barida_push.jobs where created_at<now()-interval '7 days'; delete from public.academy_push_devices where updated_at<now()-interval '90 days';$cron$);
