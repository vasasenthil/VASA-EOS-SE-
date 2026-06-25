-- VASA-EOS(SE) TN — durable tamper-evident audit hash-chain (L5 audit / platformd).
-- Backs platform/integration/audit_pg.go (the audit.Sink). Append-only: the seq primary key and the UNIQUE
-- hash mean any insertion, reordering, or truncation is detectable, and each prev_hash links to the prior
-- record's hash. On startup the platform reloads this table and RE-VERIFIES the chain, refusing to run on a
-- tampered history. Applied automatically by the sink's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS audit_chain (
    seq       BIGINT PRIMARY KEY,
    ts        TEXT NOT NULL DEFAULT '',
    actor     TEXT NOT NULL DEFAULT '',
    action    TEXT NOT NULL,
    resource  TEXT NOT NULL DEFAULT '',
    effect    TEXT NOT NULL DEFAULT '',   -- permit | deny | require-approval | executed
    detail    TEXT NOT NULL DEFAULT '',
    prev_hash TEXT NOT NULL,
    hash      TEXT NOT NULL UNIQUE        -- sha256 over the canonical payload (incl. prev_hash)
);
