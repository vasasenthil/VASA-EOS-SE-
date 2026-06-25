-- VASA-EOS(SE) TN — Academic Calendar durable store (L6 calendar service / platformd).
-- Backs platform/integration/calendar_pg.go. Entries plan the academic year (terms, exams, holidays, PTM,
-- events) and carry their dynamic multi-level approval chain as JSONB. Applied automatically by the adapter's
-- ensureSchema() on first connect; kept here as the canonical migration of record.
CREATE TABLE IF NOT EXISTS calendar_entries (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    type          TEXT NOT NULL,                       -- term | exam | holiday | ptm | event
    start_date    TEXT NOT NULL,                       -- YYYY-MM-DD (inclusive)
    end_date      TEXT NOT NULL,                       -- YYYY-MM-DD (inclusive)
    org_unit      TEXT NOT NULL,                       -- tenant node the entry applies to
    academic_year TEXT NOT NULL DEFAULT '',
    description   TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'draft',       -- draft | pending | approved | rejected
    current_step  INT  NOT NULL DEFAULT 0,
    chain         JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ordered approval steps (G-tier/role/scope/decision)
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL,
    synthetic     BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS calendar_entries_type_idx ON calendar_entries (type);
CREATE INDEX IF NOT EXISTS calendar_entries_org_idx  ON calendar_entries (org_unit);
CREATE INDEX IF NOT EXISTS calendar_entries_date_idx ON calendar_entries (start_date);
