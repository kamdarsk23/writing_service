-- Q Tree schema: run in Supabase SQL editor

-- qtree_roots: each root is also the tree's first/root question
create table public.qtree_roots (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  folder_id  uuid references public.folders(id) on delete set null,
  question   text not null default 'Untitled',
  answer     jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_qtree_roots_user   on public.qtree_roots(user_id);
create index idx_qtree_roots_folder on public.qtree_roots(folder_id);
create trigger set_qtree_roots_updated_at
  before update on public.qtree_roots
  for each row execute function public.handle_updated_at();
alter table public.qtree_roots enable row level security;
create policy "Users can view own qtree_roots"   on public.qtree_roots for select using (auth.uid() = user_id);
create policy "Users can create own qtree_roots" on public.qtree_roots for insert with check (auth.uid() = user_id);
create policy "Users can update own qtree_roots" on public.qtree_roots for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own qtree_roots" on public.qtree_roots for delete using (auth.uid() = user_id);

-- qtree_nodes: child nodes hang off either the root or another node
create table public.qtree_nodes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  qtree_root_id  uuid not null references public.qtree_roots(id) on delete cascade,
  parent_root_id uuid references public.qtree_roots(id) on delete cascade,
  parent_node_id uuid references public.qtree_nodes(id) on delete cascade,
  question       text not null default '',
  answer         jsonb not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint chk_one_parent check (
    (parent_root_id is not null)::int + (parent_node_id is not null)::int = 1
  )
);
create index idx_qtree_nodes_root        on public.qtree_nodes(qtree_root_id);
create index idx_qtree_nodes_parent_root on public.qtree_nodes(parent_root_id);
create index idx_qtree_nodes_parent_node on public.qtree_nodes(parent_node_id);
create trigger set_qtree_nodes_updated_at
  before update on public.qtree_nodes
  for each row execute function public.handle_updated_at();
alter table public.qtree_nodes enable row level security;
create policy "Users can view own qtree_nodes"   on public.qtree_nodes for select using (auth.uid() = user_id);
create policy "Users can create own qtree_nodes" on public.qtree_nodes for insert with check (auth.uid() = user_id);
create policy "Users can update own qtree_nodes" on public.qtree_nodes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own qtree_nodes" on public.qtree_nodes for delete using (auth.uid() = user_id);
