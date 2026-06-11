-- VASA-EOS(SE) — durable tables for the remaining operational + system stores.
--
-- Completes the persistence audit started in scripts/023. Five more tenant-scoped
-- operational stores (welfare distribution, promotion runs, question papers, exam
-- seating, stock movements) and two user-context system tables (audit_logs,
-- notifications) had no migration, so they too fell back to in-memory in
-- production. This creates them.

-- ---- Tenant-scoped operational tables ----
-- Same posture as scripts/023: jsonb data columns (faithful round-trip of the
-- stores' mixed values), tenant_id + the tenant_isolation policy (019). Run after 019.

create table if not exists public.distribution (
  id          text primary key,
  student     jsonb,
  item        jsonb,
  status      jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists distribution_created_idx on public.distribution (created_at desc);
alter table public.distribution enable row level security;
drop policy if exists tenant_isolation on public.distribution;
create policy tenant_isolation on public.distribution for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.promotion_runs (
  id          text primary key,
  label       jsonb,
  total       jsonb,
  promoted    jsonb,
  detained    jsonb,
  graduated   jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists promotion_runs_created_idx on public.promotion_runs (created_at desc);
alter table public.promotion_runs enable row level security;
drop policy if exists tenant_isolation on public.promotion_runs;
create policy tenant_isolation on public.promotion_runs for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.question_papers (
  id            text primary key,
  title         jsonb,
  question_ids  jsonb,
  count         jsonb,
  total_marks   jsonb,
  tenant_id     text,
  created_at    timestamptz not null default now()
);
create index if not exists question_papers_created_idx on public.question_papers (created_at desc);
alter table public.question_papers enable row level security;
drop policy if exists tenant_isolation on public.question_papers;
create policy tenant_isolation on public.question_papers for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.seating_plans (
  id          text primary key,
  label       jsonb,
  candidates  jsonb,
  seated      jsonb,
  unseated    jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists seating_plans_created_idx on public.seating_plans (created_at desc);
alter table public.seating_plans enable row level security;
drop policy if exists tenant_isolation on public.seating_plans;
create policy tenant_isolation on public.seating_plans for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.stock_movements (
  id          text primary key,
  item        jsonb,
  type        jsonb,
  qty         jsonb,
  at          jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists stock_movements_created_idx on public.stock_movements (created_at desc);
alter table public.stock_movements enable row level security;
drop policy if exists tenant_isolation on public.stock_movements;
create policy tenant_isolation on public.stock_movements for select using (public.in_tenant_subtree(tenant_id));

-- ---- User-context system tables ----
-- Written/read through the per-request SSR client (anon key + user cookies), so
-- access is governed by an own-row policy on auth.uid(); the service-role bypasses
-- it for system/admin paths. Ids and timestamps are database-generated.

create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      text,
  action       text,
  resource     text,
  resource_id  text,
  changes      jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists audit_logs_user_idx on public.audit_logs (user_id, created_at desc);
alter table public.audit_logs enable row level security;
drop policy if exists audit_logs_own on public.audit_logs;
create policy audit_logs_own on public.audit_logs for all
  using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id);

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     text,
  title       text,
  message     text,
  type        text,
  link        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications for all
  using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id);
