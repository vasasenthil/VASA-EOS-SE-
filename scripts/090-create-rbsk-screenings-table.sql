-- VASA-EOS(SE) TN — RBSK child-health screening durable store (L12 rbsk service / platformd).
-- Backs platform/integration/rbsk_pg.go. Every student is screened for the four Ds; any finding (stored as
-- JSONB) is auto-referred to the DEIC and tracked to closure. Applied by the adapter's ensureSchema(); kept
-- here as the migration of record.
CREATE TABLE IF NOT EXISTS rbsk_screenings (
    id             TEXT PRIMARY KEY,
    student_id     TEXT NOT NULL,                      -- APAAR-anchored learner id (synthetic in demo)
    org_unit       TEXT NOT NULL,                      -- the school (T6 tenancy node)
    screened_on    TEXT NOT NULL,                      -- YYYY-MM-DD
    findings       JSONB NOT NULL DEFAULT '[]'::jsonb, -- subset of: defect | disease | deficiency | disability
    status         TEXT NOT NULL,                      -- healthy | referred | under-treatment | closed
    referred_to    TEXT NOT NULL DEFAULT '',           -- DEIC on a finding
    closed_outcome TEXT NOT NULL DEFAULT '',
    updated_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS rbsk_org_idx    ON rbsk_screenings (org_unit);
CREATE INDEX IF NOT EXISTS rbsk_status_idx ON rbsk_screenings (status);
