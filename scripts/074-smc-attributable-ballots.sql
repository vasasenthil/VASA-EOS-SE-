-- VASA-EOS(SE) — add attributable ballots to the SMC (Education DAO) proposals table.
--
-- The DAO-style School Management Committee originally tallied anonymous vote counters. To make the
-- committee "on-chain ACCOUNTABLE" (every vote attributable, one member one vote), each proposal now
-- carries an array of member ballots. The legacy votes_for / votes_against counters are kept in sync
-- as the distinct-voter tally; the per-ballot tamper-evidence remains the hash-chained audit ledger.
-- Idempotent. (Base table created in scripts/015-persist-interactive-modules.sql.)

alter table if exists public.smc_proposals
  add column if not exists ballots jsonb not null default '[]'::jsonb;
