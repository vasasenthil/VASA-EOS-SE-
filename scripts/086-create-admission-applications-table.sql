-- VASA-EOS(SE) TN — durable admission applications register (admission workflow / platformd).
-- Backs platform/integration/admission_pg.go. Records the decision for each RTE admission application — stage,
-- governing reasons, HITL request id, anchored credential id — WITHOUT cleartext PII (the applicant's name is
-- sealed under the tenant KEK during the workflow; only a pii_sealed flag is kept here). Applied by the
-- adapter's ensureSchema(); kept here as the migration of record.
CREATE TABLE IF NOT EXISTS admission_applications (
    id            TEXT PRIMARY KEY,                  -- applicant id (APAAR-anchored; synthetic in demo)
    category      TEXT NOT NULL DEFAULT '',          -- GEN | OBC | SC | ST | EWS | DG
    age           INT  NOT NULL DEFAULT 0,
    tenant        TEXT NOT NULL DEFAULT '',
    region        TEXT NOT NULL DEFAULT '',
    decision      TEXT NOT NULL DEFAULT '',          -- requested: admit | reject
    stage         TEXT NOT NULL DEFAULT '',          -- admitted | denied | pending-approval | residency
    effect        TEXT NOT NULL DEFAULT '',          -- permit | deny | require-approval (from the Rego PDP)
    reasons       TEXT NOT NULL DEFAULT '',          -- governing rule ids
    request_id    TEXT NOT NULL DEFAULT '',          -- HITL request id when pending approval
    credential_id TEXT NOT NULL DEFAULT '',          -- anchored admission credential id on admit
    pii_sealed    BOOLEAN NOT NULL DEFAULT false,    -- PII was enveloped under the tenant KEK
    decided_at    TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS admission_applications_tenant_idx ON admission_applications (tenant);
CREATE INDEX IF NOT EXISTS admission_applications_stage_idx  ON admission_applications (stage);
