-- Run this in your Supabase project's SQL Editor.
create table if not exists public.study_tasks (
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null,
  task_data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, task_id)
);
alter table public.study_tasks enable row level security;
create policy "Users can read their own study tasks"
  on public.study_tasks for select using (auth.uid() = user_id);
create policy "Users can insert their own study tasks"
  on public.study_tasks for insert with check (auth.uid() = user_id);
create policy "Users can update their own study tasks"
  on public.study_tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own study tasks"
  on public.study_tasks for delete using (auth.uid() = user_id);
