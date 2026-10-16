-- v0.10: Run AFTER supabase-schema.sql in Supabase SQL Editor.
-- Progress is private to each authenticated user. No teacher/parent access is granted.
create table if not exists public.learning_progress (
 user_id uuid primary key references auth.users(id) on delete cascade,
 lessons jsonb not null default '[]'::jsonb,
 mate_solved jsonb not null default '[]'::jsonb,
 updated_at timestamptz not null default now(),
 constraint lessons_array check (jsonb_typeof(lessons)='array' and jsonb_array_length(lessons)<=6),
 constraint mate_array check (jsonb_typeof(mate_solved)='array' and jsonb_array_length(mate_solved)<=28)
);
alter table public.learning_progress enable row level security;
create policy "Own progress read" on public.learning_progress for select to authenticated using (auth.uid()=user_id);
create policy "Own progress insert" on public.learning_progress for insert to authenticated with check (auth.uid()=user_id);
create policy "Own progress update" on public.learning_progress for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
-- Do not add anonymous access or broad select policies.
