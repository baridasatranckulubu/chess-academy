-- Chess Academy v0.8. Run in Supabase SQL Editor before enabling signups.
-- Student/parent self-registration; teacher role is NOT self-assignable.
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (username ~ '^[A-Za-z0-9_]{3,24}$'),
 full_name text not null default '',
 role text not null default 'student' check (role in ('student','parent','teacher','admin')),
 requested_role text not null default 'student' check (requested_role in ('student','parent','teacher')),
 phone text,
 address text,
 created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "View own profile" on public.profiles for select to authenticated using (auth.uid()=id);
-- No client insert/update/delete policy: only trusted trigger and server admin manage profiles.
create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r text;
begin
 r := coalesce(new.raw_user_meta_data->>'requested_role','student');
 -- Defense in depth: require adult self-declaration for public signup.
 -- This is NOT age verification; do not launch child registration without guardian verification.
 if coalesce(new.raw_user_meta_data->>'age_group','') <> 'adult' then
   raise exception 'Adult declaration required for current public registration';
 end if;
 if r not in ('student','parent','teacher') then r := 'student'; end if;
 insert into public.profiles(id,username,full_name,role,requested_role,phone,address)
 values(new.id,lower(coalesce(new.raw_user_meta_data->>'username','')),
 left(coalesce(new.raw_user_meta_data->>'full_name',''),80),
 case when r='teacher' then 'student' else r end,r,
 case when r='student' then null else nullif(left(coalesce(new.raw_user_meta_data->>'phone',''),24),'') end,
 case when r='parent' then nullif(left(coalesce(new.raw_user_meta_data->>'address',''),250),'') else null end);
 return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile_for_new_user();
-- Approve teachers only via Supabase SQL Editor / trusted admin backend:
-- update public.profiles set role='teacher' where id='<verified-user-uuid>' and requested_role='teacher';
-- NOTE: Do not grant browser clients UPDATE on profiles. Configure SMTP, email confirmation,
-- CAPTCHA, rate limits, and legal parental-consent flow before public launch.

-- v0.9: server-side account data constraints (apply to a new project or migrate carefully).
alter table public.profiles add constraint full_name_max_len check (char_length(full_name)<=80);
alter table public.profiles add constraint phone_max_len check (phone is null or char_length(phone)<=24);
alter table public.profiles add constraint address_max_len check (address is null or char_length(address)<=250);
-- Important: only trusted admins can set role='teacher' or 'admin'; the browser has no update policy.
