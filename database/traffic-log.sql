-- Private telemetry. Only the signed server receiver can write; only admins can read.
create table if not exists private.barida_traffic_events(
 id bigint generated always as identity primary key,
 event_id uuid not null unique, visitor_id uuid not null,
 created_at timestamptz not null default now(),
 event text not null check(event in ('visit','page','login','logout','leave')),
 page text not null, user_id uuid references auth.users(id) on delete set null,
 username text, display_name text, device text not null,
 browser text, platform text, country text, city text, ip inet,
 host text not null
);
alter table private.barida_traffic_events enable row level security;
revoke all on private.barida_traffic_events from public,anon,authenticated;
create index if not exists barida_traffic_created_idx on private.barida_traffic_events(created_at desc,id desc);
create index if not exists barida_traffic_user_idx on private.barida_traffic_events(user_id,created_at desc);
create table if not exists private.barida_traffic_limits(ip inet primary key,window_start timestamptz not null,attempts int not null);
alter table private.barida_traffic_limits enable row level security;
revoke all on private.barida_traffic_limits from public,anon,authenticated;
create or replace function public.barida_traffic_record(p_event jsonb,p_user uuid default null,p_session uuid default null)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_ip inet; v_count int; v_name text; v_username text;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise insufficient_privilege;end if;
 v_ip:=nullif(p_event->>'ip','')::inet;
 if v_ip is not null then
  insert into private.barida_traffic_limits as l values(v_ip,date_trunc('minute',now()),1)
  on conflict(ip) do update set attempts=case when l.window_start=date_trunc('minute',now()) then least(l.attempts+1,6001) else 1 end,window_start=date_trunc('minute',now()) returning attempts into v_count;
  if v_count>6000 then return false;end if;
 end if;
 if p_user is not null then
  if not exists(select 1 from auth.sessions s where s.id=p_session and s.user_id=p_user and (s.not_after is null or s.not_after>now())) then p_user:=null;end if;
 end if;
 if p_user is not null then select username,display_name into v_username,v_name from public.profiles where id=p_user;end if;
 insert into private.barida_traffic_events(event_id,visitor_id,event,page,user_id,username,display_name,device,browser,platform,country,city,ip,host)
 values((p_event->>'event_id')::uuid,(p_event->>'visitor_id')::uuid,p_event->>'event',left(p_event->>'page',100),p_user,v_username,v_name,left(p_event->>'device',30),left(p_event->>'browser',40),left(p_event->>'platform',40),left(p_event->>'country',80),left(p_event->>'city',120),v_ip,left(p_event->>'host',100)) on conflict(event_id) do nothing;
 return true;
end $$;
revoke all on function public.barida_traffic_record(jsonb,uuid,uuid) from public,anon,authenticated;
grant execute on function public.barida_traffic_record(jsonb,uuid,uuid) to service_role;
create or replace function barida_security.traffic_report(p_from date,p_to date,p_event text default '',p_device text default '',p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_from timestamptz;v_to timestamptz;v_result jsonb;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise insufficient_privilege using message='Yalnızca yönetici erişebilir';end if;
 v_from:=greatest(p_from::timestamp at time zone 'Europe/Istanbul',(date_trunc('month',now() at time zone 'Europe/Istanbul')-interval '1 month') at time zone 'Europe/Istanbul');
 v_to:=(p_to+1)::timestamp at time zone 'Europe/Istanbul';
 if p_from is null or p_to is null or p_to<p_from or p_to-p_from>62 then raise exception 'Geçersiz tarih aralığı';end if;
 with filtered as materialized(select * from private.barida_traffic_events where created_at>=v_from and created_at<v_to and (p_event='' or event=p_event) and (p_device='' or device=p_device)),
 rows as (select * from filtered order by created_at desc,id desc limit 100 offset greatest(0,least(coalesce(p_offset,0),100000)))
 select jsonb_build_object('total',(select count(*) from filtered),'visitors',(select count(distinct visitor_id) from filtered),'visits',(select count(*) from filtered where event='visit'),'logins',(select count(*) from filtered where event='login'),'logouts',(select count(*) from filtered where event='logout'),'leaves',(select count(*) from filtered where event='leave'),'rows',coalesce((select jsonb_agg(to_jsonb(rows) order by created_at desc,id desc) from rows),'[]'::jsonb),'daily',coalesce((select jsonb_agg(to_jsonb(d) order by day desc) from (select (created_at at time zone 'Europe/Istanbul')::date as day,count(*) as events,count(*) filter(where event='visit') as visits,count(*) filter(where event='login') as logins,count(*) filter(where event='logout') as logouts from filtered group by 1)d),'[]'::jsonb)) into v_result;
 return v_result;
end $$;
revoke all on function barida_security.traffic_report(date,date,text,text,integer) from public,anon;
grant execute on function barida_security.traffic_report(date,date,text,text,integer) to authenticated;
create or replace function public.barida_traffic_report(p_from date,p_to date,p_event text default '',p_device text default '',p_offset integer default 0)
returns jsonb language sql stable security invoker set search_path='' as $$select barida_security.traffic_report(p_from,p_to,p_event,p_device,p_offset)$$;
revoke all on function public.barida_traffic_report(date,date,text,text,integer) from public,anon;
grant execute on function public.barida_traffic_report(date,date,text,text,integer) to authenticated;
create or replace function barida_security.prune_traffic_logs()
returns void language sql security definer set search_path='' as $$
 delete from private.barida_traffic_events where created_at < (date_trunc('month',now() at time zone 'Europe/Istanbul')-interval '1 month') at time zone 'Europe/Istanbul';
 delete from private.barida_traffic_limits where window_start<now()-interval '1 day';
$$;
revoke all on function barida_security.prune_traffic_logs() from public,anon,authenticated;
select cron.schedule('barida-traffic-retention','5 * * * *','select barida_security.prune_traffic_logs()');
