begin;
set local lock_timeout='5s';
create schema if not exists barida_security;
revoke all on schema barida_security from public;
grant usage on schema barida_security to anon,authenticated,service_role;
create table if not exists private.app_request_limits(
 user_id uuid primary key references auth.users(id) on delete cascade,
 attempts integer not null check(attempts between 1 and 180),
 window_start timestamptz not null
);
alter table private.app_request_limits enable row level security;
revoke all on private.app_request_limits from public,anon,authenticated;
create index if not exists app_request_limits_window on private.app_request_limits(window_start);
create index if not exists student_login_attempts_window on private.student_login_attempts(window_start);
create or replace function barida_security.academy_request_guard()
returns void language plpgsql security definer set search_path='' as $$
declare uid uuid; sid uuid; claim_role text; allowed boolean; verb text;
begin
 claim_role:=coalesce(auth.jwt()->>'role','');
 if claim_role='service_role' then return; end if;
 uid:=auth.uid();
 if uid is null then raise sqlstate 'PT401' using message='Oturum gerekli.';end if;
 begin sid:=nullif(auth.jwt()->>'session_id','')::uuid;exception when invalid_text_representation then sid:=null;end;
 if sid is null or not exists(select 1 from auth.sessions s where s.id=sid and s.user_id=uid and (s.not_after is null or s.not_after>now())) then
  raise sqlstate 'PT401' using message='Oturum sona erdi. Yeniden giriş yapın.';
 end if;
 verb:=current_setting('request.method',true);
 -- GET/HEAD and STABLE/IMMUTABLE RPC transactions are read-only. Authorization still applies.
 if verb is null or verb in ('GET','HEAD','OPTIONS') or current_setting('transaction_read_only')='on' then return;end if;
 insert into private.app_request_limits(user_id,attempts,window_start) values(uid,1,clock_timestamp())
 on conflict(user_id) do update set
 attempts=case when private.app_request_limits.window_start<clock_timestamp()-interval '1 minute' then 1 else least(private.app_request_limits.attempts+1,180) end,
 window_start=case when private.app_request_limits.window_start<clock_timestamp()-interval '1 minute' then clock_timestamp() else private.app_request_limits.window_start end
 -- Once exhausted, do not update or grant more requests until the window resets.
 where private.app_request_limits.window_start<clock_timestamp()-interval '1 minute' or private.app_request_limits.attempts<180
 returning true into allowed;
 if not coalesce(allowed,false) then
  raise sqlstate 'PGRST' using message='{"code":"BARIDA_RATE_LIMIT","message":"Çok fazla işlem. Bir dakika sonra tekrar deneyin.","details":null,"hint":null}',detail='{"status":429,"headers":{"Retry-After":"60"}}';
 end if;
end;
$$;
revoke all on function barida_security.academy_request_guard() from public;
grant execute on function barida_security.academy_request_guard() to anon,authenticated,service_role;
create or replace function public.academy_student_rate_limit(k text)
returns boolean language plpgsql security definer set search_path='' as $$
declare allowed boolean;
begin
 if k is null or k !~ '^[a-f0-9]{64}$' then return false;end if;
 insert into private.student_login_attempts(key,attempts,window_start) values(k,1,now())
 on conflict(key) do update set attempts=case when private.student_login_attempts.window_start<now()-interval '15 minutes' then 1 else least(private.student_login_attempts.attempts+1,9) end,
 window_start=case when private.student_login_attempts.window_start<now()-interval '15 minutes' then now() else private.student_login_attempts.window_start end
 returning attempts<=8 into allowed;return allowed;
end;
$$;
revoke all on function public.academy_student_rate_limit(text) from public,anon,authenticated;
grant execute on function public.academy_student_rate_limit(text) to service_role;
select cron.schedule('barida-security-expired-counters','17 * * * *',$job$delete from private.app_request_limits where window_start<now()-interval '1 day'; delete from private.student_login_attempts where window_start<now()-interval '1 day';$job$)
where not exists(select 1 from cron.job where jobname='barida-security-expired-counters');
alter role authenticator set pgrst.db_pre_request='barida_security.academy_request_guard';
notify pgrst,'reload config';
notify pgrst,'reload schema';
commit;
