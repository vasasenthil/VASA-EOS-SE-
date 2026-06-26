-- VASA-EOS(SE) TN — Teacher CPD durable store (L6 cpd service / platformd).
-- Backs platform/integration/cpd_pg.go. The record of in-service training (NISHTHA/SCERT/DIET/DIKSHA) a teacher
-- completes, feeding the NEP 2020 compliance analytics (>=50 hours/year). Applied by the adapter's
-- ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS cpd_records (
    id           TEXT PRIMARY KEY,
    teacher_id   TEXT NOT NULL,                 -- HRMS employee id (synthetic in demo)
    org_unit     TEXT NOT NULL,                 -- the teacher's school (T6 tenancy node)
    course       TEXT NOT NULL DEFAULT '',
    provider     TEXT NOT NULL,                 -- NISHTHA | SCERT | DIET | DIKSHA
    hours        INT  NOT NULL DEFAULT 0,
    year         INT  NOT NULL,
    status       TEXT NOT NULL,                 -- enrolled | completed | certified
    completed_on TEXT NOT NULL DEFAULT '',      -- YYYY-MM-DD
    recorded_at  TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS cpd_teacher_year_idx ON cpd_records (teacher_id, year);
CREATE INDEX IF NOT EXISTS cpd_org_year_idx     ON cpd_records (org_unit, year);
