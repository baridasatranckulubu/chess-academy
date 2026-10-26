-- Device ownership follows the authenticated user; tokens are never public.
create table if not exists public.academy_push_devices (
 token text primary key check (length(token) between 20 and 4096),
 user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
 updated_at timestamptz not null default now()
);
alter table public.academy_push_devices enable row level security;
create index if not exists academy_push_devices_user on public.academy_push_devices(user_id);
revoke all on public.academy_push_devices from public,anon,authenticated;
grant select,insert,update,delete on public.academy_push_devices to authenticated;
grant all on public.academy_push_devices to service_role;
create policy push_device_owner on public.academy_push_devices to authenticated
 using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create or replace function public.academy_register_push_device(p_token text)
returns void language sql security invoker set search_path='' as $$
 insert into public.academy_push_devices(token,user_id) values(p_token,auth.uid())
 on conflict(token) do update set updated_at=now();
$$;
create or replace function public.academy_unregister_push_device(p_token text)
returns void language sql security invoker set search_path='' as $$
 delete from public.academy_push_devices where token=p_token and user_id=auth.uid();
$$;
revoke all on function public.academy_register_push_device(text) from public,anon;
revoke all on function public.academy_unregister_push_device(text) from public,anon;
grant execute on function public.academy_register_push_device(text) to authenticated;
grant execute on function public.academy_unregister_push_device(text) to authenticated;
