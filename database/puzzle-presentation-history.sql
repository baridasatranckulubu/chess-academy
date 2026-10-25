-- Persist every shown puzzle independently of its rating outcome.
create table if not exists public.barida_puzzle_seen(
 user_id uuid not null references public.profiles(id) on delete cascade,
 puzzle_id text not null check(puzzle_id~'^[A-Za-z0-9]{5}$'),
 seen_at timestamptz not null default now(),
 primary key(user_id,puzzle_id)
);
alter table public.barida_puzzle_seen enable row level security;
revoke all on public.barida_puzzle_seen from anon,authenticated;
grant select on public.barida_puzzle_seen to authenticated;
drop policy if exists "sports read own shown puzzles" on public.barida_puzzle_seen;
create policy "sports read own shown puzzles" on public.barida_puzzle_seen for select to authenticated using(user_id=(select auth.uid()));
create or replace function public.barida_puzzle_history() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();begin
 if uid is null or not exists(select 1 from public.profiles where id=uid and role='student') then raise exception 'Sporcu oturumu gerekli';end if;
 return coalesce((select jsonb_agg(distinct id) from(
  select puzzle_id id from public.barida_puzzle_seen where user_id=uid
  union select item_id from public.academy_training_attempts where user_id=uid
  union select puzzle_id from public.academy_assignment_attempts where student_id=uid
  union select puzzle_id from public.academy_student_puzzle_reservations where student_id=uid
  union select item->>0 from public.academy_assignments a cross join lateral jsonb_array_elements(a.puzzle_items) item where a.student_id=uid
 ) x where id~'^[A-Za-z0-9]{5}$'),'[]'::jsonb);
end $$;
revoke all on function public.barida_puzzle_history() from public,anon;
grant execute on function public.barida_puzzle_history() to authenticated;
create or replace function public.barida_puzzle_claim(p_puzzle text) returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();added integer;begin
 if uid is null or not exists(select 1 from public.profiles where id=uid and role='student') then raise exception 'Sporcu oturumu gerekli';end if;
 if exists(select 1 from public.academy_student_status where student_id=uid and not active) then raise exception 'Hesap pasif';end if;
 if p_puzzle is null or p_puzzle!~'^[A-Za-z0-9]{5}$' then raise exception 'Geçersiz soru';end if;
 if exists(select 1 from public.academy_training_attempts where user_id=uid and item_id=p_puzzle)
 or exists(select 1 from public.academy_assignment_attempts where student_id=uid and puzzle_id=p_puzzle)
 or exists(select 1 from public.academy_student_puzzle_reservations where student_id=uid and puzzle_id=p_puzzle)
 or exists(select 1 from public.academy_assignments a cross join lateral jsonb_array_elements(a.puzzle_items) item where a.student_id=uid and item->>0=p_puzzle)
 then return false;end if;
 insert into public.barida_puzzle_seen(user_id,puzzle_id) values(uid,p_puzzle) on conflict do nothing;
 get diagnostics added=row_count;return added=1;
end $$;
revoke all on function public.barida_puzzle_claim(text) from public,anon;
grant execute on function public.barida_puzzle_claim(text) to authenticated;
