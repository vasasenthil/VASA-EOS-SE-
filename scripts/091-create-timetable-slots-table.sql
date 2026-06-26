-- VASA-EOS(SE) TN — School Timetable durable store (L6 timetable service / platformd).
-- Backs platform/integration/timetable_pg.go. One subject+teacher per (class, day, period); the teacher-clash
-- invariant (a teacher can never be in two classes at once) is enforced by the adapter before each upsert.
-- Applied by the adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS timetable_slots (
    org_unit   TEXT NOT NULL,                 -- the school (T6 tenancy node)
    class      TEXT NOT NULL,                 -- e.g. "Grade 8-A"
    day        TEXT NOT NULL,                 -- monday..saturday
    period     INT  NOT NULL,                 -- 1..8
    subject    TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    PRIMARY KEY (org_unit, class, day, period)
);
CREATE INDEX IF NOT EXISTS timetable_teacher_idx ON timetable_slots (teacher_id, day, period);
