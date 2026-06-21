-- VASA-EOS(SE) TN — Examinations & Results durable store (L6 exams service / platformd).
-- Backs platform/integration/exams_pg.go. A marks sheet per examination and one row per student result.
-- Applied automatically by the adapter's ensureSchema() on first connect; kept here as the migration of record.
CREATE TABLE IF NOT EXISTS exam_sheets (
    exam_id   TEXT PRIMARY KEY,
    org_unit  TEXT NOT NULL,                  -- the school (T6) the exam belongs to
    subject   TEXT NOT NULL,
    class     TEXT NOT NULL,
    max_marks INT  NOT NULL,
    status    TEXT NOT NULL DEFAULT 'open'    -- open | submitted | published | returned
);

CREATE TABLE IF NOT EXISTS exam_results (
    exam_id    TEXT NOT NULL REFERENCES exam_sheets(exam_id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,                 -- APAAR-anchored learner id (synthetic in demo)
    marks      INT  NOT NULL,
    grade      TEXT NOT NULL DEFAULT '',      -- A1..E, computed on submit
    pass       BOOLEAN NOT NULL DEFAULT false,
    seq        BIGSERIAL,                     -- preserves entry order
    PRIMARY KEY (exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS exam_sheets_org_idx ON exam_sheets (org_unit);
