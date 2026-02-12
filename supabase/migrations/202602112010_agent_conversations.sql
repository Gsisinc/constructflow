-- Agent conversation support for Base44 agents compatibility layer.

create table if not exists public.agent_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.agent_conversations(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.agent_conversations enable row level security;
alter table public.agent_messages enable row level security;

create policy if not exists "users can view own conversations"
  on public.agent_conversations for select
  using (user_id = auth.uid());

create policy if not exists "users can create own conversations"
  on public.agent_conversations for insert
  with check (user_id = auth.uid());

create policy if not exists "users can update own conversations"
  on public.agent_conversations for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy if not exists "users can view own messages"
  on public.agent_messages for select
  using (
    exists (
      select 1
      from public.agent_conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy if not exists "users can create own messages"
  on public.agent_messages for insert
  with check (
    exists (
      select 1
      from public.agent_conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy if not exists "users can delete own messages"
  on public.agent_messages for delete
  using (
    exists (
      select 1
      from public.agent_conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  );

drop trigger if exists set_agent_conversations_updated_at on public.agent_conversations;
create trigger set_agent_conversations_updated_at
before update on public.agent_conversations
for each row execute function public.update_timestamp();
