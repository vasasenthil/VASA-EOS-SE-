-- VASA-EOS(SE) — Phase-0 production hardening: deny-by-default RLS on EVERY public table.
--
-- Per-table RLS is enabled across the migrations, but a few legacy tables (created with varying
-- syntax) slipped through. This is the belt-and-suspenders government-grade guarantee: a catalogue
-- loop that enables row-level security on every base table in the public schema, so the provisioned
-- database is deny-by-default everywhere regardless of how each table was created. Runs last;
-- idempotent (enabling RLS twice is a no-op). The service-role client the app uses bypasses RLS and
-- remains the only identity that touches these tables today.

do $$
declare
  r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security;', r.tablename);
  end loop;
end $$;
