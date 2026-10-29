begin;
insert into auth.users(id,aud,role,email,raw_user_meta_data,created_at,updated_at) values
('4a98d79c-4df2-4ae0-9203-b2d17d639781','authenticated','authenticated','security-qa-one@example.invalid','{"display_name":"Security QA One"}',now(),now()),
('5a98d79c-4df2-4ae0-9203-b2d17d639782','authenticated','authenticated','security-qa-two@example.invalid','{"display_name":"Security QA Two"}',now(),now());
insert into auth.sessions(id,user_id) values('6a98d79c-4df2-4ae0-9203-b2d17d639783','4a98d79c-4df2-4ae0-9203-b2d17d639781'),('7a98d79c-4df2-4ae0-9203-b2d17d639784','5a98d79c-4df2-4ae0-9203-b2d17d639782');
select set_config('request.method','POST',true),set_config('request.jwt.claims','{"role":"authenticated","sub":"4a98d79c-4df2-4ae0-9203-b2d17d639781","session_id":"6a98d79c-4df2-4ae0-9203-b2d17d639783"}',true);
do $$begin
for i in 1..180 loop perform barida_security.academy_request_guard();end loop;
begin perform barida_security.academy_request_guard();raise exception 'Rate limit did not block';exception when sqlstate 'PGRST' then null;end;
perform set_config('request.method','GET',true);perform barida_security.academy_request_guard();
if (select attempts from private.app_request_limits where user_id='4a98d79c-4df2-4ae0-9203-b2d17d639781')<>180 then raise exception 'Read changed counter';end if;
perform set_config('request.method','POST',true);
perform set_config('request.jwt.claims','{"role":"authenticated","sub":"5a98d79c-4df2-4ae0-9203-b2d17d639782","session_id":"7a98d79c-4df2-4ae0-9203-b2d17d639784"}',true);
perform barida_security.academy_request_guard();
perform set_config('request.jwt.claims','{"role":"authenticated","sub":"5a98d79c-4df2-4ae0-9203-b2d17d639782","session_id":"00000000-0000-0000-0000-000000000000"}',true);
begin perform barida_security.academy_request_guard();raise exception 'Revoked session allowed';exception when sqlstate 'PT401' then null;end;
perform set_config('request.jwt.claims','{"role":"anon"}',true);
begin perform barida_security.academy_request_guard();raise exception 'Anonymous allowed';exception when sqlstate 'PT401' then null;end;
perform set_config('request.jwt.claims','{"role":"service_role"}',true);perform barida_security.academy_request_guard();
if public.academy_student_rate_limit('invalid-key') then raise exception 'Invalid limiter key allowed';end if;
for i in 1..8 loop if not public.academy_student_rate_limit(repeat('e',64)) then raise exception 'Early denial';end if;end loop;
if public.academy_student_rate_limit(repeat('e',64)) then raise exception 'Ninth login allowed';end if;
if has_function_privilege('anon','public.academy_student_rate_limit(text)','execute') then raise exception 'Internal limiter exposed';end if;
end;$$;
rollback;
select 'PASS authenticated rate limit, account isolation, GET safety, missing session/anonymous denial, service operations and login limit' as status;