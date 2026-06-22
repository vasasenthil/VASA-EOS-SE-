-- VASA-EOS(SE) TN — Parent-Teacher Meeting durable store (L6 ptm service / platformd).
-- Backs platform/integration/ptm_pg.go. Two tables: scheduled PTM sessions (with a fixed slot count) and the
-- guardian bookings against them. The capacity-checked booking invariants — a session can never be OVERBOOKED
-- beyond its slots, a guardian can never double-book the same session, a cancelled session takes no bookings,
-- and a booking walks booked → attended | no_show (a cancellation frees its slot) — are enforced by the adapter
-- against the durable bookings; the partial unique index below backstops the no-double-booking rule. Applied by
-- the adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS ptm_sessions (
    id       TEXT PRIMARY KEY,
    org_unit TEXT NOT NULL,                       -- the school (T6 tenancy node)
    title    TEXT NOT NULL,
    date     TEXT NOT NULL,                        -- YYYY-MM-DD
    slots    INT  NOT NULL,                        -- booking capacity (the hard ceiling)
    status   TEXT NOT NULL                         -- scheduled | cancelled
);
CREATE TABLE IF NOT EXISTS ptm_bookings (
    id         TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    org_unit   TEXT NOT NULL,
    student_id TEXT NOT NULL,
    guardian   TEXT NOT NULL DEFAULT '',
    status     TEXT NOT NULL,                      -- booked | attended | no_show | cancelled
    slot       TEXT NOT NULL DEFAULT ''            -- optional time-slot label
);
CREATE INDEX IF NOT EXISTS ptm_bookings_session_idx ON ptm_bookings (session_id, status);
-- a student holds at most one active (non-cancelled) booking per session.
CREATE UNIQUE INDEX IF NOT EXISTS ptm_bookings_active_idx ON ptm_bookings (session_id, student_id) WHERE status<>'cancelled';
