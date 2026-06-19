-- VASA-EOS(SE) — durable table for the Verifiable Credential Ledger (NFT / soulbound tokens).
--
-- Learner achievements minted as non-transferable (soulbound) credentials, soulbound to the holder's
-- APAAR id and ANCHORED to the tamper-evident audit ledger via anchor_seq. content_hash is computed
-- over the issuance fields at mint time; verification recomputes it to detect any post-mint tampering.
-- Revocation is an append-only overlay (revoked / revoked_at / revoke_reason) — it never alters the
-- minted content, so an authentically-minted-but-revoked credential still verifies as authentic while
-- reporting its revoked status. The in-app analogue of the brief's permissioned-blockchain academic
-- records + NFT credentials (NOT a distributed ledger / on-chain mint). RLS deny-by-default.

create table if not exists public.verifiable_credentials (
  id            text primary key,
  apaar_id      text not null,
  kind          text not null,
  title         text not null,
  issuer        text not null,
  issued_at     timestamptz not null default now(),
  soulbound     boolean not null default true,
  content_hash  text not null,
  anchor_seq    bigint not null,
  revoked       boolean not null default false,
  revoked_at    timestamptz,
  revoke_reason text not null default ''
);

create index if not exists verifiable_credentials_holder_idx on public.verifiable_credentials (apaar_id);
create index if not exists verifiable_credentials_kind_idx on public.verifiable_credentials (kind);
create index if not exists verifiable_credentials_anchor_idx on public.verifiable_credentials (anchor_seq);

alter table public.verifiable_credentials enable row level security;
