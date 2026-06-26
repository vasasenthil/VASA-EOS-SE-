-- VASA-EOS(SE) TN — Staff Leave & Approval durable store (L6 leave service / platformd).
-- Backs platform/integration/leave_pg.go. The Next.js leave-approval flow (app/leave-approvals) calls platformd
-- which persists here. The dynamic multi-level approval chain (principal → +BEO over 5 days → +DEO over 15 days)
-- is stored as JSONB. Applied automatically by the adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS leave_requests (
    id           TEXT PRIMARY KEY,
    employee     TEXT NOT NULL,
    type         TEXT NOT NULL,                       -- casual | medical | earned | maternity | duty
    from_date    TEXT NOT NULL,                       -- YYYY-MM-DD
    to_date      TEXT NOT NULL,                       -- YYYY-MM-DD
    days         INT  NOT NULL,
    reason       TEXT NOT NULL DEFAULT '',
    org_unit     TEXT NOT NULL,                       -- the school the request is filed at
    status       TEXT NOT NULL DEFAULT 'pending',     -- pending | approved | rejected
    chain        JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ordered approval steps (role/decision/decided_by/...)
    current_step INT  NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS leave_requests_org_idx    ON leave_requests (org_unit);
CREATE INDEX IF NOT EXISTS leave_requests_status_idx ON leave_requests (status);
