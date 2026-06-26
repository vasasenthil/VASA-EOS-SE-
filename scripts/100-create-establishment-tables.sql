-- VASA-EOS(SE) TN — Staff Establishment & Sanctioned-Post Register durable store (L6 establishment service /
-- platformd). Backs platform/integration/establishment_pg.go. Two tables: the sanctioned-post lines (a cadre at
-- a school with a sanctioned strength) and the appointments made against them. The accountability invariant —
-- the FILLED posts of a cadre can never exceed its SANCTIONED strength (the over-appointment gate) — is enforced
-- by the adapter against the durable filled count before each insert; the partial unique index below backstops
-- the one-filled-post-per-employee-per-establishment rule. A vacated post frees its slot; vacancy (sanctioned −
-- filled) is derived. Applied by the adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS establishments (
    id         TEXT PRIMARY KEY,
    org_unit   TEXT NOT NULL,                      -- the school (T6 tenancy node)
    cadre      TEXT NOT NULL,                       -- e.g. Graduate Teacher (BT) | Headmaster | Office Assistant
    sanctioned INT  NOT NULL,                       -- sanctioned strength (the hard ceiling)
    status     TEXT NOT NULL                        -- active | frozen
);
CREATE TABLE IF NOT EXISTS establishment_appointments (
    id               TEXT PRIMARY KEY,
    establishment_id TEXT NOT NULL,
    org_unit         TEXT NOT NULL,
    employee_id      TEXT NOT NULL,
    name             TEXT NOT NULL DEFAULT '',
    status           TEXT NOT NULL,                 -- filled | vacated
    appointed_on     TEXT NOT NULL                  -- YYYY-MM-DD
);
CREATE INDEX IF NOT EXISTS establishments_org_idx        ON establishments (org_unit, status);
CREATE INDEX IF NOT EXISTS estab_appts_establishment_idx ON establishment_appointments (establishment_id, status);
-- an employee holds at most one filled post per establishment.
CREATE UNIQUE INDEX IF NOT EXISTS estab_appts_emp_idx ON establishment_appointments (establishment_id, employee_id) WHERE status='filled';
