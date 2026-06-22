-- VASA-EOS(SE) TN — School Health Immunisation durable store (L6 immunisation service / platformd).
-- Backs platform/integration/immunisation_pg.go. Each row is one vaccine dose administered to a student under
-- the school-health schedule (UIP / RBSK school-age vaccines). The clinical invariants — a dose may only be
-- recorded in SEQUENCE (dose N requires doses 1..N-1 already given), a vaccine can never exceed its scheduled
-- dose count, and a dose cannot be future-dated — are enforced by the adapter against the durable doses before
-- the upsert; the partial unique index below backstops the no-duplicate-dose-slot rule. Health data is
-- sensitive: aggregate coverage is surfaced publicly, the per-child worklist only to the governing officer.
-- Applied by the adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS immunisation_doses (
    id              TEXT PRIMARY KEY,
    student_id      TEXT NOT NULL,
    org_unit        TEXT NOT NULL,                 -- the school (T6 tenancy node)
    vaccine         TEXT NOT NULL,                 -- schedule code (Td10 | Td16 | MR | JE | VitA | Albendazole)
    dose_number     INT  NOT NULL,                 -- 1..required for the vaccine
    administered_on TEXT NOT NULL,                 -- YYYY-MM-DD (never future-dated)
    batch           TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS immunisation_student_idx ON immunisation_doses (student_id, vaccine);
CREATE INDEX IF NOT EXISTS immunisation_org_idx     ON immunisation_doses (org_unit);
-- a student can hold a given vaccine dose number at most once (backstops the no-duplicate-slot invariant).
CREATE UNIQUE INDEX IF NOT EXISTS immunisation_dose_slot_idx ON immunisation_doses (student_id, vaccine, dose_number);
