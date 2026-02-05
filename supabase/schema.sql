-- Writing Service Database Schema
-- Run this in the Supabase SQL Editor after creating your project.

-- ============================================
-- Tables
-- ============================================

create table public.folders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  parent_id   uuid references public.folders(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_folders_parent on public.folders(parent_id);
create index idx_folders_user on public.folders(user_id);

create table public.works (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  folder_id   uuid references public.folders(id) on delete set null,
  title       text not null default 'Untitled',
  content     jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_works_folder on public.works(folder_id);
create index idx_works_user on public.works(user_id);

-- ============================================
-- Auto-update updated_at trigger
-- ============================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_folders_updated_at
  before update on public.folders
  for each row execute function public.handle_updated_at();

create trigger set_works_updated_at
  before update on public.works
  for each row execute function public.handle_updated_at();

-- ============================================
-- Row Level Security
-- ============================================

alter table public.folders enable row level security;

create policy "Users can view own folders"
  on public.folders for select using (auth.uid() = user_id);

create policy "Users can create own folders"
  on public.folders for insert with check (auth.uid() = user_id);

create policy "Users can update own folders"
  on public.folders for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own folders"
  on public.folders for delete using (auth.uid() = user_id);

alter table public.works enable row level security;

create policy "Users can view own works"
  on public.works for select using (auth.uid() = user_id);

create policy "Users can create own works"
  on public.works for insert with check (auth.uid() = user_id);

create policy "Users can update own works"
  on public.works for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own works"
  on public.works for delete using (auth.uid() = user_id);
