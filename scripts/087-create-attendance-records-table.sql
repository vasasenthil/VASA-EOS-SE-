-- VASA-EOS(SE) TN — Student Attendance durable store (L6 attendance service / platformd).
-- Backs platform/integration/attendance_pg.go. One row per student per day (upserted, so re-marking corrects
-- rather than duplicates). Feeds the RTE chronic-absentee early-warning analytics. Applied by the adapter's
-- ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS attendance_records (
    student_id TEXT NOT NULL,                 -- APAAR-anchored learner id (synthetic in demo)
    org_unit   TEXT NOT NULL,                 -- the school (T6 tenancy node)
    date       TEXT NOT NULL,                 -- YYYY-MM-DD
    status     TEXT NOT NULL,                 -- present | absent | late | excused
    source     TEXT NOT NULL DEFAULT '',      -- biometric | manual | rfid
    marked_by  TEXT NOT NULL DEFAULT '',
    marked_at  TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (student_id, date)
);
CREATE INDEX IF NOT EXISTS attendance_org_date_idx ON attendance_records (org_unit, date);
CREATE INDEX IF NOT EXISTS attendance_student_idx  ON attendance_records (student_id);
