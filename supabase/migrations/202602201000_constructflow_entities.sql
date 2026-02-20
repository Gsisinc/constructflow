-- ConstructFlow entities for self-hosted (Supabase) backend.
-- Table names match appClient: toSnakeCase(EntityName) + 's'

alter table public.organizations add column if not exists owner_email text;

create table if not exists public.bid_opportunitys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  title text,
  project_name text,
  status text default 'new',
  agency text,
  client_name text,
  location text,
  due_date timestamptz,
  estimated_value numeric(12,2),
  value numeric(12,2),
  win_probability numeric(5,2),
  description text,
  url text,
  scope_of_work text,
  ai_analysis jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bid_documents (
  id uuid primary key default gen_random_uuid(),
  bid_opportunity_id uuid not null references public.bid_opportunitys(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  name text,
  file_url text not null,
  file_size bigint,
  extracted_data jsonb,
  ai_processed boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.bid_estimates (
  id uuid primary key default gen_random_uuid(),
  bid_opportunity_id uuid not null references public.bid_opportunitys(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  line_items jsonb default '[]'::jsonb,
  labor_hours numeric(10,2),
  labor_rate numeric(10,2),
  labor_cost numeric(12,2),
  material_cost numeric(12,2),
  equipment_cost numeric(12,2),
  subcontractor_cost numeric(12,2),
  overhead_percent numeric(5,2),
  profit_margin_percent numeric(5,2),
  subtotal numeric(12,2),
  total_bid_amount numeric(12,2),
  notes text,
  version integer default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete cascade,
  po_number text,
  vendor text not null,
  po_date date,
  status text default 'draft',
  subtotal numeric(12,2),
  tax numeric(12,2),
  shipping numeric(12,2),
  total numeric(12,2),
  line_items jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bid_opportunitys_org on public.bid_opportunitys(organization_id);
create index if not exists idx_bid_documents_bid on public.bid_documents(bid_opportunity_id);
create index if not exists idx_bid_estimates_bid on public.bid_estimates(bid_opportunity_id);
create index if not exists idx_purchase_orders_org on public.purchase_orders(organization_id);

alter table public.bid_opportunitys enable row level security;
alter table public.bid_documents enable row level security;
alter table public.bid_estimates enable row level security;
alter table public.purchase_orders enable row level security;

create policy "org members bid_opportunitys" on public.bid_opportunitys for all
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()))
  with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy "org members bid_documents" on public.bid_documents for all
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()))
  with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy "org members bid_estimates" on public.bid_estimates for all
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()))
  with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy "org members purchase_orders" on public.purchase_orders for all
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()))
  with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));
