-- VASA-EOS(SE) TN — School Transport route-safety durable store (L6 transport service / platformd).
-- Backs platform/integration/transport_pg.go. Two tables: bus routes (vehicle + driver with statutory validity
-- dates) and the student seat allotments on them. The two hard safety invariants — a route can never exceed its
-- seating capacity, and no student may be allotted to an UNSERVICEABLE vehicle (lapsed fitness certificate or
-- driver licence) — are enforced by the adapter against the durable state before each insert; the
-- one-active-seat-per-student-per-route rule is backstopped by the partial unique index below. Applied by the
-- adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS transport_routes (
    id                 TEXT PRIMARY KEY,
    org_unit           TEXT NOT NULL,                 -- the school (T6 tenancy node)
    name               TEXT NOT NULL DEFAULT '',
    vehicle_no         TEXT NOT NULL,
    capacity           INT  NOT NULL,                 -- seating capacity (the hard ceiling)
    fitness_valid_till TEXT NOT NULL,                 -- vehicle FC expiry (YYYY-MM-DD)
    driver_name        TEXT NOT NULL DEFAULT '',
    licence_valid_till TEXT NOT NULL,                 -- driver licence expiry (YYYY-MM-DD)
    status             TEXT NOT NULL                  -- active | suspended
);
CREATE TABLE IF NOT EXISTS transport_allotments (
    id         TEXT PRIMARY KEY,
    route_id   TEXT NOT NULL,
    org_unit   TEXT NOT NULL,
    student_id TEXT NOT NULL,
    stop       TEXT NOT NULL DEFAULT '',
    status     TEXT NOT NULL                          -- allotted | withdrawn
);
CREATE INDEX IF NOT EXISTS transport_allot_route_idx ON transport_allotments (route_id, status);
-- at most one active seat per student per route.
CREATE UNIQUE INDEX IF NOT EXISTS transport_allot_unique_idx ON transport_allotments (route_id, student_id) WHERE status='allotted';
