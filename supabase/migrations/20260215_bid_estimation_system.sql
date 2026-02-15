-- Advanced Bid Estimation System
-- Comprehensive schema for document analysis, drawing takeoffs, estimates, and proposals

-- Bid Opportunities (enhanced existing table if needed via Base44)
-- BidOpportunity already exists in Base44

-- Bid Documents table for specification uploads
create table if not exists public.bid_documents (
  id uuid primary key default gen_random_uuid(),
  bid_opportunity_id uuid not null, -- references BidOpportunity in Base44
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_type text not null check (document_type in ('specification', 'drawing', 'addendum', 'other')),
  file_name text not null,
  file_url text not null,
  file_size bigint,
  mime_type text,
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- AI Document Analysis Results
create table if not exists public.document_analysis (
  id uuid primary key default gen_random_uuid(),
  bid_document_id uuid not null references public.bid_documents(id) on delete cascade,
  bid_opportunity_id uuid not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  analysis_type text not null check (analysis_type in ('specification', 'drawing', 'blueprint')),
  
  -- Specification Analysis
  scope_of_work text,
  key_requirements jsonb default '[]'::jsonb, -- array of requirement objects
  submittal_requirements jsonb default '[]'::jsonb,
  insurance_requirements jsonb,
  bonding_requirements jsonb,
  prevailing_wage boolean default false,
  project_duration_days integer,
  liquidated_damages text,
  
  -- Drawing/Blueprint Analysis
  drawing_type text, -- 'electrical', 'low_voltage', 'mechanical', 'plumbing', 'architectural'
  scale text,
  sheet_number text,
  extracted_quantities jsonb default '[]'::jsonb, -- array of quantity takeoff items
  room_counts jsonb,
  
  -- AI metadata
  confidence_score decimal(3,2),
  processing_time_ms integer,
  model_used text,
  
  analyzed_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- Estimates table
create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  bid_opportunity_id uuid not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  estimate_number text unique,
  estimate_name text not null,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'approved', 'submitted', 'won', 'lost')),
  
  -- Pricing
  subtotal decimal(12,2) not null default 0,
  tax_rate decimal(5,4) default 0,
  tax_amount decimal(12,2) default 0,
  markup_percent decimal(5,2) default 0,
  markup_amount decimal(12,2) default 0,
  total_amount decimal(12,2) not null default 0,
  
  -- Metadata
  notes text,
  internal_notes text,
  valid_until date,
  payment_terms text,
  
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Estimate Line Items (material/labor/equipment breakdown)
create table if not exists public.estimate_line_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  
  -- Categorization
  category text not null check (category in ('material', 'labor', 'equipment', 'subcontractor', 'other')),
  trade text, -- 'low_voltage', 'electrical', 'hvac', etc
  phase text, -- 'rough_in', 'trim', 'testing', etc
  
  -- Item details
  item_code text,
  description text not null,
  specification text,
  manufacturer text,
  model_number text,
  
  -- Quantities
  quantity decimal(12,3) not null default 0,
  unit text not null default 'ea', -- 'ea', 'ft', 'lf', 'sf', 'box', 'hour', etc
  
  -- Pricing
  unit_cost decimal(12,2) not null default 0,
  extended_cost decimal(12,2) not null default 0,
  markup_percent decimal(5,2) default 0,
  unit_price decimal(12,2) not null default 0,
  total_price decimal(12,2) not null default 0,
  
  -- Source tracking
  source text check (source in ('manual', 'ai_specification', 'ai_drawing', 'template')),
  source_document_id uuid references public.bid_documents(id),
  location_reference text, -- room number, floor, zone from drawings
  
  -- Metadata
  notes text,
  sort_order integer default 0,
  
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Proposal Templates
create table if not exists public.proposal_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  template_name text not null,
  template_type text not null check (template_type in ('standard', 'municipal', 'federal', 'private', 'custom')),
  
  -- Content sections
  cover_page jsonb,
  executive_summary_template text,
  scope_of_work_template text,
  project_approach_template text,
  timeline_template text,
  qualifications_template text,
  terms_conditions_template text,
  
  is_default boolean default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Generated Proposals
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  bid_opportunity_id uuid not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  proposal_number text unique,
  
  -- Content
  title text not null,
  executive_summary text,
  scope_of_work text,
  project_approach text,
  timeline text,
  qualifications text,
  terms_and_conditions text,
  
  -- Generated document
  pdf_url text,
  docx_url text,
  
  -- Status
  status text not null default 'draft' check (status in ('draft', 'ready', 'sent', 'accepted', 'rejected')),
  sent_at timestamptz,
  
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Estimate Assembly (links estimates to analyzed documents)
create table if not exists public.estimate_assemblies (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  document_analysis_id uuid not null references public.document_analysis(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Create indexes
create index if not exists idx_bid_documents_bid_opp on public.bid_documents(bid_opportunity_id);
create index if not exists idx_bid_documents_org on public.bid_documents(organization_id);
create index if not exists idx_document_analysis_bid_doc on public.document_analysis(bid_document_id);
create index if not exists idx_document_analysis_bid_opp on public.document_analysis(bid_opportunity_id);
create index if not exists idx_estimates_bid_opp on public.estimates(bid_opportunity_id);
create index if not exists idx_estimates_org on public.estimates(organization_id);
create index if not exists idx_estimate_line_items_estimate on public.estimate_line_items(estimate_id);
create index if not exists idx_proposals_estimate on public.proposals(estimate_id);
create index if not exists idx_proposals_bid_opp on public.proposals(bid_opportunity_id);

-- Enable RLS
alter table public.bid_documents enable row level security;
alter table public.document_analysis enable row level security;
alter table public.estimates enable row level security;
alter table public.estimate_line_items enable row level security;
alter table public.proposal_templates enable row level security;
alter table public.proposals enable row level security;
alter table public.estimate_assemblies enable row level security;

-- RLS Policies
create policy "org members can manage bid documents"
  on public.bid_documents for all
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()))
  with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy "org members can manage document analysis"
  on public.document_analysis for all
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()))
  with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy "org members can manage estimates"
  on public.estimates for all
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()))
  with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy "org members can manage estimate line items"
  on public.estimate_line_items for all
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()))
  with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy "org members can manage proposal templates"
  on public.proposal_templates for all
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()))
  with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy "org members can manage proposals"
  on public.proposals for all
  using (organization_id = (select organization_id from public.profiles where id = auth.uid()))
  with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy "org members can manage estimate assemblies"
  on public.estimate_assemblies for all
  using (exists (
    select 1 from public.estimates e 
    where e.id = estimate_assemblies.estimate_id 
    and e.organization_id = (select organization_id from public.profiles where id = auth.uid())
  ));

-- Triggers for updated_at
create trigger update_estimates_timestamp
  before update on public.estimates
  for each row execute function public.update_timestamp();

create trigger update_estimate_line_items_timestamp
  before update on public.estimate_line_items
  for each row execute function public.update_timestamp();

create trigger update_proposals_timestamp
  before update on public.proposals
  for each row execute function public.update_timestamp();

create trigger update_proposal_templates_timestamp
  before update on public.proposal_templates
  for each row execute function public.update_timestamp();

-- Function to generate estimate number
create or replace function generate_estimate_number(org_id uuid)
returns text
language plpgsql
as $$
declare
  next_num integer;
  year_str text;
begin
  year_str := to_char(now(), 'YY');
  
  select coalesce(max(cast(substring(estimate_number from '[0-9]+$') as integer)), 0) + 1
  into next_num
  from public.estimates
  where organization_id = org_id
    and estimate_number like 'EST-' || year_str || '-%';
  
  return 'EST-' || year_str || '-' || lpad(next_num::text, 4, '0');
end;
$$;

-- Function to generate proposal number
create or replace function generate_proposal_number(org_id uuid)
returns text
language plpgsql
as $$
declare
  next_num integer;
  year_str text;
begin
  year_str := to_char(now(), 'YY');
  
  select coalesce(max(cast(substring(proposal_number from '[0-9]+$') as integer)), 0) + 1
  into next_num
  from public.proposals
  where organization_id = org_id
    and proposal_number like 'PROP-' || year_str || '-%';
  
  return 'PROP-' || year_str || '-' || lpad(next_num::text, 4, '0');
end;
$$;

-- Function to recalculate estimate totals
create or replace function recalculate_estimate_totals(est_id uuid)
returns void
language plpgsql
as $$
declare
  line_total decimal(12,2);
  est record;
begin
  -- Get sum of all line items
  select coalesce(sum(total_price), 0) into line_total
  from public.estimate_line_items
  where estimate_id = est_id;
  
  -- Get current estimate settings
  select * into est from public.estimates where id = est_id;
  
  -- Calculate totals
  update public.estimates
  set 
    subtotal = line_total,
    markup_amount = line_total * (est.markup_percent / 100),
    tax_amount = (line_total + (line_total * (est.markup_percent / 100))) * (est.tax_rate / 100),
    total_amount = line_total + 
                   (line_total * (est.markup_percent / 100)) + 
                   ((line_total + (line_total * (est.markup_percent / 100))) * (est.tax_rate / 100)),
    updated_at = now()
  where id = est_id;
end;
$$;

-- Trigger to recalculate estimate when line items change
create or replace function trigger_recalculate_estimate()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'DELETE' then
    perform recalculate_estimate_totals(OLD.estimate_id);
    return OLD;
  else
    perform recalculate_estimate_totals(NEW.estimate_id);
    return NEW;
  end if;
end;
$$;

create trigger recalc_estimate_on_line_item_change
  after insert or update or delete on public.estimate_line_items
  for each row execute function trigger_recalculate_estimate();
