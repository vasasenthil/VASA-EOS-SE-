-- VASA-EOS(SE) — P2 tenant isolation hardening.
--
-- Every public table with a tenant_id column must have the same deny-by-default tenant
-- policy, not just RLS enabled. This migration is intentionally catalogue-driven so
-- future tenant-scoped tables inherit the guard during bootstrap/cutover without
-- relying on each feature migration to remember policy DDL.

do $$
declare
  r record;
begin
  for r in
    select table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'tenant_id'
    group by table_name
  loop
    execute format('alter table public.%I enable row level security;', r.table_name);
    execute format('drop policy if exists tenant_isolation on public.%I;', r.table_name);
    execute format(
      'create policy tenant_isolation on public.%I for all using (public.in_tenant_subtree(tenant_id)) with check (public.in_tenant_subtree(tenant_id));',
      r.table_name
    );
  end loop;
end $$;
