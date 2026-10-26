-- Run against a development database or transactionally; never commits test rows.
begin;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles order by created_at limit 1),true);
set local role authenticated;
select public.academy_register_push_device('barida-verification-token-never-a-real-device');
reset role;
insert into public.academy_notifications(recipient_id,category,title,body)
values(auth.uid(),'message','Push verification','Transaction rollback test');
do $$begin
 if (select count(*) from barida_push.jobs where token='barida-verification-token-never-a-real-device')<>1 then
  raise exception 'Expected exactly one queued notification';
 end if;
 if has_function_privilege('authenticated','public.academy_claim_push_jobs()','execute') then
  raise exception 'Worker RPC exposed to users';
 end if;
end $$;
rollback;
