-- VASA-EOS(SE) TN — Infrastructure & Asset Register durable store (L6 infra service / platformd).
-- Backs platform/integration/infra_pg.go. Two tables: the school asset register (rooms/ICT/furniture/sanitation
-- with a condition grade) and the maintenance tickets raised against them. The register invariants — a ticket
-- may only be raised against a known, non-decommissioned asset; a ticket walks open → in_progress → resolved →
-- closed; and an asset can never be decommissioned (or returned to service) while it still has open tickets — are
-- enforced by the adapter against the durable state (a critical ticket's auto-flip to under_maintenance is
-- written in the same transaction as the ticket). Applied by the adapter's ensureSchema(); kept here as the
-- migration of record.
CREATE TABLE IF NOT EXISTS infra_assets (
    id          TEXT PRIMARY KEY,
    org_unit    TEXT NOT NULL,                 -- the school (T6 tenancy node)
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,                 -- room | furniture | equipment | ict | sanitation | ...
    condition   TEXT NOT NULL,                 -- good | fair | poor | unusable
    status      TEXT NOT NULL,                 -- in_service | under_maintenance | decommissioned
    acquired_on TEXT NOT NULL DEFAULT ''       -- YYYY-MM-DD
);
CREATE TABLE IF NOT EXISTS infra_tickets (
    id          TEXT PRIMARY KEY,
    asset_id    TEXT NOT NULL,
    org_unit    TEXT NOT NULL,
    issue       TEXT NOT NULL,
    severity    TEXT NOT NULL,                 -- low | medium | high | critical
    status      TEXT NOT NULL,                 -- open | in_progress | resolved | closed
    raised_on   TEXT NOT NULL,
    assignee    TEXT NOT NULL DEFAULT '',
    resolved_on TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS infra_assets_org_idx    ON infra_assets (org_unit, status);
CREATE INDEX IF NOT EXISTS infra_tickets_asset_idx ON infra_tickets (asset_id, status);
