-- VASA-EOS(SE) — Phase-0 production hardening: close the last RLS gap.
--
-- A coverage audit of every migration found a single table created WITHOUT row-level security:
-- public.agent_tool_requests (the human-in-the-loop agent tool-approval queue, scripts/020). The
-- service-role client bypasses RLS and is the only identity that touches it in the app today, but
-- deny-by-default RLS on EVERY table is the correct government-grade posture (defence-in-depth for the
-- anon / authenticated keys). This enables it with no permissive policy. Idempotent.
--
-- tests/rls-coverage.test.ts now gates this: every `create table` must have RLS enabled somewhere in
-- the migration set, so this gap can never silently reopen.

alter table if exists public.agent_tool_requests enable row level security;
