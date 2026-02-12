-- Backend-enforced immutable audit guarantees
-- 1) append-only writes
-- 2) server-side hash chain
-- 3) integrity verification helper

alter table if exists public.audit_log
  add column if not exists prev_hash text,
  add column if not exists event_hash text,
  add column if not exists signed_at timestamptz,
  add column if not exists signature_version text default 'v1';

create or replace function public.audit_log_compute_hash(
  _org_id uuid,
  _action text,
  _entity_type text,
  _entity_id text,
  _before jsonb,
  _after jsonb,
  _metadata jsonb,
  _logged_at timestamptz,
  _prev_hash text
)
returns text
language sql
immutable
as $$
  select encode(
    digest(
      concat_ws('||',
        coalesce(_org_id::text, ''),
        coalesce(_action, ''),
        coalesce(_entity_type, ''),
        coalesce(_entity_id, ''),
        coalesce(_before::text, '{}'),
        coalesce(_after::text, '{}'),
        coalesce(_metadata::text, '{}'),
        coalesce(_logged_at::text, ''),
        coalesce(_prev_hash, '')
      )::bytea,
      'sha256'
    ),
    'hex'
  );
$$;

create or replace function public.audit_log_before_insert()
returns trigger
language plpgsql
security definer
as $$
declare
  last_hash text;
begin
  select event_hash
    into last_hash
  from public.audit_log
  where organization_id is not distinct from new.organization_id
  order by logged_at desc, id desc
  limit 1;

  new.prev_hash := coalesce(last_hash, null);
  new.signed_at := now();
  new.event_hash := public.audit_log_compute_hash(
    new.organization_id,
    new.action,
    new.entity_type,
    new.entity_id,
    new.before_state,
    new.after_state,
    new.metadata,
    coalesce(new.logged_at, now()),
    new.prev_hash
  );

  return new;
end;
$$;

drop trigger if exists trg_audit_log_before_insert on public.audit_log;
create trigger trg_audit_log_before_insert
before insert on public.audit_log
for each row
execute function public.audit_log_before_insert();

create or replace function public.audit_log_prevent_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_log is append-only; updates and deletes are prohibited';
end;
$$;

drop trigger if exists trg_audit_log_prevent_update on public.audit_log;
create trigger trg_audit_log_prevent_update
before update on public.audit_log
for each row
execute function public.audit_log_prevent_mutation();

drop trigger if exists trg_audit_log_prevent_delete on public.audit_log;
create trigger trg_audit_log_prevent_delete
before delete on public.audit_log
for each row
execute function public.audit_log_prevent_mutation();

create or replace function public.verify_audit_log_chain(_org_id uuid)
returns table(id uuid, valid boolean)
language plpgsql
as $$
declare
  rec record;
  expected text;
  prev text;
begin
  prev := null;
  for rec in
    select *
    from public.audit_log
    where organization_id is not distinct from _org_id
    order by logged_at asc, id asc
  loop
    expected := public.audit_log_compute_hash(
      rec.organization_id,
      rec.action,
      rec.entity_type,
      rec.entity_id,
      rec.before_state,
      rec.after_state,
      rec.metadata,
      rec.logged_at,
      prev
    );

    id := rec.id;
    valid := (rec.prev_hash is not distinct from prev) and rec.event_hash = expected;
    return next;

    prev := rec.event_hash;
  end loop;
end;
$$;
