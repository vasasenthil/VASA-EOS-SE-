-- VASA-EOS(SE) TN — Grievance Redressal case store (L12 grievance service / platformd).
-- Backs platform/integration/grievance_case_pg.go. A citizen grievance becomes a durable case handled by a
-- tier of officers under an SLA; the escalation chain (by category) is stored as JSONB, and a case past its
-- due_at is auto-escalated by the platform's SLA sweep. Applied by the adapter's ensureSchema(); migration of record.
CREATE TABLE IF NOT EXISTS grievance_cases (
    id           TEXT PRIMARY KEY,
    complainant  TEXT NOT NULL,
    category     TEXT NOT NULL,                       -- academic | infrastructure | safety | financial | service
    subject      TEXT NOT NULL DEFAULT '',
    org_unit     TEXT NOT NULL,                       -- the school/office the grievance concerns
    status       TEXT NOT NULL DEFAULT 'open',        -- open | resolved | rejected | escalated
    chain        JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ordered handler tiers (role/decision/decided_by/...)
    current_tier INT  NOT NULL DEFAULT 0,
    filed_at     TEXT NOT NULL,
    due_at       TEXT NOT NULL,                       -- SLA deadline for the current tier
    resolution   TEXT NOT NULL DEFAULT '',
    updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS grievance_cases_org_idx    ON grievance_cases (org_unit);
CREATE INDEX IF NOT EXISTS grievance_cases_status_idx ON grievance_cases (status);
