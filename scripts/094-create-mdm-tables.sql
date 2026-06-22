-- VASA-EOS(SE) TN — Mid-Day Meal (PM-POSHAN) durable store (L6 mdm service / platformd).
-- Backs platform/integration/mdm_pg.go. Two tables: the per-school foodgrain stock ledger (receipts in,
-- consumptions out) and the daily meal-service register. Foodgrain is tracked in GRAMS (BIGINT, never floats),
-- mirroring the money-in-paise discipline. The core accountability invariant — stock can never go negative (a
-- day can never cook more grain than is on hand) — is enforced by the adapter against the durable balance INSIDE
-- the same transaction that writes the meal + its matching consumption ledger entry, so service and draw-down
-- are atomic. Applied by the adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS mdm_ledger (
    id          TEXT PRIMARY KEY,
    org_unit    TEXT   NOT NULL,                  -- the school (T6 tenancy node)
    date        TEXT   NOT NULL,                  -- YYYY-MM-DD
    kind        TEXT   NOT NULL,                  -- receipt | consumption
    grain_grams BIGINT NOT NULL,                  -- positive movement size in grams
    note        TEXT   NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS mdm_meals (
    id           TEXT PRIMARY KEY,
    org_unit     TEXT   NOT NULL,
    date         TEXT   NOT NULL,
    meals_served INT    NOT NULL,                 -- <= enrolment (data-quality gate)
    enrolment    INT    NOT NULL,
    grain_grams  BIGINT NOT NULL                  -- grain cooked for this day's service
);
CREATE INDEX IF NOT EXISTS mdm_ledger_org_idx ON mdm_ledger (org_unit, kind);
CREATE INDEX IF NOT EXISTS mdm_meals_org_idx  ON mdm_meals (org_unit, date);
