-- Core self-hosted schema for ConstructFlow migration from Base44.
-- Run with: supabase db push

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  organization_id uuid references public.organizations(id) on delete set null,
  role text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  status text default 'planning',
  start_date date,
  end_date date,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  status text default 'todo',
  priority text default 'medium',
  due_date date,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  severity text default 'medium',
  status text default 'open',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null,
  expense_date date not null default current_date,
  category text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  type text,
  file_url text not null,
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.issues enable row level security;
alter table public.expenses enable row level security;
alter table public.documents enable row level security;

create policy if not exists "profile readable by owner"
  on public.profiles for select
  using (id = auth.uid());

create policy if not exists "profile updatable by owner"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy if not exists "org members can view organizations"
  on public.organizations for select
  using (id = (select organization_id from public.profiles where id = auth.uid()));

create policy if not exists "org owner can update organization"
  on public.organizations for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy if not exists "org members can view projects"
  on public.projects for select
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy if not exists "org members can insert projects"
  on public.projects for insert
  with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy if not exists "org members can update projects"
  on public.projects for update
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()))
  with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy if not exists "org members can view tasks"
  on public.tasks for select
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy if not exists "org members can manage tasks"
  on public.tasks for all
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()))
  with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy if not exists "org members can manage issues"
  on public.issues for all
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()))
  with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy if not exists "org members can manage expenses"
  on public.expenses for all
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()))
  with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy if not exists "org members can manage documents"
  on public.documents for all
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()))
  with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create or replace function public.update_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.update_timestamp();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row execute function public.update_timestamp();
