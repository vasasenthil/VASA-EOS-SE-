-- VASA-EOS(SE) TN — Fee & Finance Ledger durable store (L6 fees service / platformd).
-- Backs platform/integration/fees_pg.go. Two tables: fee demands raised against students and the payments
-- collected against them. Every amount is in PAISE (BIGINT, never floats), mirroring the money-in-paise
-- discipline used across the platform's finance verticals. The no-overpayment invariant — a payment can never
-- take the collected total above the amount demanded — is enforced by the adapter against the durable collected
-- total INSIDE the same transaction that writes the payment and recomputes the demand status (pending → partial
-- → paid), so collection and status are atomic. Applied by the adapter's ensureSchema(); kept here as the
-- migration of record.
CREATE TABLE IF NOT EXISTS fee_demands (
    id           TEXT PRIMARY KEY,
    org_unit     TEXT   NOT NULL,                -- the school (T6 tenancy node)
    student_id   TEXT   NOT NULL,
    category     TEXT   NOT NULL,                -- exam | hostel | special | ...
    term         TEXT   NOT NULL DEFAULT '',
    amount_paise BIGINT NOT NULL,                -- gross amount due, in paise
    status       TEXT   NOT NULL,                -- pending | partial | paid | waived | cancelled
    due_on       TEXT   NOT NULL                 -- YYYY-MM-DD
);
CREATE TABLE IF NOT EXISTS fee_payments (
    id           TEXT PRIMARY KEY,
    demand_id    TEXT   NOT NULL,
    org_unit     TEXT   NOT NULL,
    student_id   TEXT   NOT NULL,
    amount_paise BIGINT NOT NULL,                -- collection amount, in paise
    mode         TEXT   NOT NULL,                -- cash | online | upi | dd | cheque
    reference    TEXT   NOT NULL DEFAULT '',
    paid_on      TEXT   NOT NULL                 -- YYYY-MM-DD
);
CREATE INDEX IF NOT EXISTS fee_demands_org_idx     ON fee_demands (org_unit, status);
CREATE INDEX IF NOT EXISTS fee_payments_demand_idx ON fee_payments (demand_id);
