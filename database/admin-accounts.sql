begin;
create table if not exists private.admin_account_audit (
 id bigint generated always as identity primary key,
 actor_id uuid not null,target_id uuid not null,action text not null check(action in ('create','reset')),
 created_at timestamptz not null default now()
);
alter table private.admin_account_audit enable row level security;
revoke all on private.admin_account_audit from public,anon,authenticated;
create or replace function barida_security.admin_account_finalize(p_actor uuid,p_target uuid,p_action text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if p_action not in ('create','reset') or not exists(select 1 from public.profiles where id=p_actor and role='admin')
 or not exists(select 1 from public.profiles where id=p_target and role='admin') then raise exception 'Yönetici yetkisi gerekli';end if;
 if p_action='reset' then delete from auth.sessions where user_id=p_target;end if;
 insert into private.admin_account_audit(actor_id,target_id,action) values(p_actor,p_target,p_action);
end $$;
revoke all on function barida_security.admin_account_finalize(uuid,uuid,text) from public,anon,authenticated;
grant execute on function barida_security.admin_account_finalize(uuid,uuid,text) to service_role;
grant usage on schema barida_security to service_role;
create or replace function public.barida_admin_account_finalize(p_actor uuid,p_target uuid,p_action text)
returns void language sql security invoker set search_path='' as $$ select barida_security.admin_account_finalize(p_actor,p_target,p_action) $$;
revoke all on function public.barida_admin_account_finalize(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.barida_admin_account_finalize(uuid,uuid,text) to service_role;
commit;
