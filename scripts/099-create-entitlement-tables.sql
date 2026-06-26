-- VASA-EOS(SE) TN — Free-Supply Entitlement Distribution durable store (L6 entitlement service / platformd).
-- Backs platform/integration/entitlement_pg.go. Two tables: the per-student entitlements under TN's free-supply
-- schemes (textbooks/uniforms/notebooks/…) and the issues (distribution events) made against them. The
-- accountability invariant — a student can never be issued MORE than their entitlement (the over-issue/leakage
-- gate) — is enforced by the adapter against the durable issued total INSIDE the same transaction that writes
-- the issue and recomputes the entitlement status (pending → partial → fulfilled), so the distribution and
-- status are atomic. Applied by the adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS entitlements (
    id           TEXT PRIMARY KEY,
    org_unit     TEXT NOT NULL,                    -- the school (T6 tenancy node)
    student_id   TEXT NOT NULL,
    item         TEXT NOT NULL,                    -- textbook | notebook | uniform | shoes | bag | cycle | ...
    entitled_qty INT  NOT NULL,                    -- units owed
    term         TEXT NOT NULL DEFAULT '',
    status       TEXT NOT NULL                     -- pending | partial | fulfilled | cancelled
);
CREATE TABLE IF NOT EXISTS entitlement_issues (
    id             TEXT PRIMARY KEY,
    entitlement_id TEXT NOT NULL,
    org_unit       TEXT NOT NULL,
    student_id     TEXT NOT NULL,
    qty            INT  NOT NULL,                  -- units issued in this distribution event
    issued_on      TEXT NOT NULL,                  -- YYYY-MM-DD
    reference      TEXT NOT NULL DEFAULT ''        -- goods-received-note / acknowledgement ref
);
CREATE INDEX IF NOT EXISTS entitlements_org_idx       ON entitlements (org_unit, status);
CREATE INDEX IF NOT EXISTS entitlement_issues_ent_idx ON entitlement_issues (entitlement_id);
