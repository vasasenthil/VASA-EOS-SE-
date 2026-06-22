-- VASA-EOS(SE) TN — Scholarship / DBT durable store (L6 scholarship service / platformd).
-- Backs platform/integration/scholarship_pg.go. A scholarship is sanctioned through an amount-driven multi-level
-- fund-approval chain (PFMS/GFR, stored as JSONB), disbursed with a payment reference, then reconciled against
-- the rail (unmatched = a leakage flag). Money is held in paise (BIGINT) — never floats. Applied by the
-- adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS scholarship_disbursements (
    id           TEXT PRIMARY KEY,
    student_id   TEXT NOT NULL,                       -- APAAR-anchored learner id
    scheme       TEXT NOT NULL,                       -- pre-matric | post-matric | merit | maintenance
    amount_paise BIGINT NOT NULL,                     -- money in paise (Rs 1 = 100 paise)
    org_unit     TEXT NOT NULL,                       -- the school the beneficiary belongs to
    status       TEXT NOT NULL DEFAULT 'pending',     -- pending|sanctioned|disbursed|reconciled|flagged|rejected
    chain        JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ordered sanction tiers (role/decision/decided_by/...)
    current_step INT  NOT NULL DEFAULT 0,
    payment_ref  TEXT NOT NULL DEFAULT '',            -- PFMS/treasury transaction reference on disbursement
    filed_at     TEXT NOT NULL,
    updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS scholarship_org_idx    ON scholarship_disbursements (org_unit);
CREATE INDEX IF NOT EXISTS scholarship_status_idx ON scholarship_disbursements (status);
