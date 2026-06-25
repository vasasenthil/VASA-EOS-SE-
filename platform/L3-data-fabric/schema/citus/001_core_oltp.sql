-- VASA-EOS(SE) TN — Citus OLTP core schema (CC-SPEC-001 §18, §10.4 L3 data fabric).
--
-- This is the production-shaped port of the reference implementation's OLTP schema (crosswalk: PORT). It is
-- the canonical multi-tenant core into which the remaining functional-module tables co-locate. Design:
--   * Every tenant-scoped table carries tenant_id and is sharded by it (see 002_distribution.sql) so a
--     tenant's rows co-locate on one shard — joins stay local, the platform scales horizontally to ~69k
--     schools / ~1.27 Cr students.
--   * Row-Level Security keyed on the session GUC app.current_tenant fences every read/write to the caller's
--     jurisdiction (defence in depth beneath the application PEP; §8, §17).
--   * Small, slowly-changing dimensions are Citus REFERENCE tables (replicated to every node).
--
-- This file is vanilla-PostgreSQL-valid (validated against PG 16 in CI / locally); the Citus-specific
-- distribution calls live in 002_distribution.sql and run on a Citus cluster (BLOCKERS B-013).

BEGIN;

CREATE SCHEMA IF NOT EXISTS vasa;
SET search_path TO vasa, public;

-- Tenancy tree (T0 national → T6 school). Reference table: tiny, read on every request, replicated.
CREATE TABLE IF NOT EXISTS tenant_node (
    tenant_id   text PRIMARY KEY,
    parent_id   text REFERENCES tenant_node(tenant_id),
    tier        smallint NOT NULL CHECK (tier BETWEEN 0 AND 6), -- 0=national … 6=school
    name        text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- Schools (T6). Distributed by tenant_id.
CREATE TABLE IF NOT EXISTS school (
    tenant_id   text NOT NULL,
    school_id   uuid NOT NULL DEFAULT gen_random_uuid(),
    udise_code  text,
    name        text NOT NULL,
    block       text,
    district    text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, school_id)
);

-- Students. APAAR id is Class-1 PII → stored as an opaque reference; payload is encrypted by the KMS plane.
CREATE TABLE IF NOT EXISTS student (
    tenant_id     text NOT NULL,
    student_id    uuid NOT NULL DEFAULT gen_random_uuid(),
    school_id     uuid NOT NULL,
    apaar_ref     text,                          -- pointer to the encrypted APAAR record (never the raw id)
    pii_envelope  bytea,                         -- KMS-sealed PII blob (envelope encryption)
    grade         smallint CHECK (grade BETWEEN 0 AND 12),
    category      text CHECK (category IN ('GEN','OBC','SC','ST','EWS','DG')),
    created_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, student_id)
);

-- Enrolment / admission lifecycle (RTE 25% quota flows port here).
CREATE TABLE IF NOT EXISTS enrolment (
    tenant_id    text NOT NULL,
    enrolment_id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id   uuid NOT NULL,
    school_id    uuid NOT NULL,
    status       text NOT NULL CHECK (status IN ('applied','screened','admitted','rejected','withdrawn')),
    rte_quota    boolean NOT NULL DEFAULT false,
    decided_by   text,
    decided_at   timestamptz,
    PRIMARY KEY (tenant_id, enrolment_id)
);

-- Assessments / marks (Class-2 sensitive).
CREATE TABLE IF NOT EXISTS assessment (
    tenant_id     text NOT NULL,
    assessment_id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id    uuid NOT NULL,
    subject       text NOT NULL,
    term          text NOT NULL,
    marks         numeric(5,2),
    recorded_by   text NOT NULL,
    recorded_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, assessment_id)
);

-- Scheme fund ledger (PFMS/DBT flows; release is a require-approval action under PBAC).
CREATE TABLE IF NOT EXISTS fund_ledger (
    tenant_id    text NOT NULL,
    entry_id     uuid NOT NULL DEFAULT gen_random_uuid(),
    scheme       text NOT NULL,
    amount_paisa bigint NOT NULL CHECK (amount_paisa >= 0),
    direction    text NOT NULL CHECK (direction IN ('sanction','release','utilisation','recovery')),
    sanctioned_by text,
    approved_by   text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, entry_id)
);

-- DPDP consent ledger (lawful-basis record for PII processing; minors need guardian consent).
CREATE TABLE IF NOT EXISTS consent_ledger (
    tenant_id     text NOT NULL,
    consent_id    uuid NOT NULL DEFAULT gen_random_uuid(),
    subject_ref   text NOT NULL,                 -- the data principal (student/guardian) reference
    purpose       text NOT NULL,
    granted       boolean NOT NULL,
    guardian      boolean NOT NULL DEFAULT false,-- true when consent is by a guardian (minor)
    valid_from    timestamptz NOT NULL DEFAULT now(),
    withdrawn_at  timestamptz,
    PRIMARY KEY (tenant_id, consent_id)
);

-- Grievances / RTI (civic layer L12 ports here).
CREATE TABLE IF NOT EXISTS grievance (
    tenant_id    text NOT NULL,
    grievance_id uuid NOT NULL DEFAULT gen_random_uuid(),
    category     text NOT NULL,
    status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open','triaged','resolved','escalated','closed')),
    filed_by     text,
    filed_at     timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, grievance_id)
);

-- Immutable audit (hash-chained by the L5 audit service; the DB stores the sealed records).
CREATE TABLE IF NOT EXISTS audit_log (
    tenant_id  text NOT NULL,
    seq        bigint NOT NULL,
    ts         timestamptz NOT NULL,
    actor      text,
    action     text NOT NULL,
    resource   text,
    effect     text,
    detail     text,
    prev_hash  text NOT NULL,
    hash       text NOT NULL,
    PRIMARY KEY (tenant_id, seq)
);

-- ---- Row-Level Security: fence every tenant-scoped table to app.current_tenant ----
-- The application sets `SET app.current_tenant = '<tenant>'` per request (after the PEP authorises scope).
-- These policies are defence-in-depth: even a query bug cannot cross tenant boundaries.

DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'school','student','enrolment','assessment','fund_ledger','consent_ledger','grievance','audit_log'
    ] LOOP
        EXECUTE format('ALTER TABLE vasa.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('ALTER TABLE vasa.%I FORCE ROW LEVEL SECURITY', t);
        EXECUTE format($p$
            CREATE POLICY tenant_isolation ON vasa.%I
            USING (tenant_id = current_setting('app.current_tenant', true))
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true))
        $p$, t);
    END LOOP;
END$$;

-- audit_log is append-only: forbid UPDATE/DELETE at the table level (immutability, §17.6).
REVOKE UPDATE, DELETE ON vasa.audit_log FROM PUBLIC;

CREATE INDEX IF NOT EXISTS idx_student_school   ON vasa.student (tenant_id, school_id);
CREATE INDEX IF NOT EXISTS idx_enrolment_student ON vasa.enrolment (tenant_id, student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_student ON vasa.assessment (tenant_id, student_id);
CREATE INDEX IF NOT EXISTS idx_fund_scheme       ON vasa.fund_ledger (tenant_id, scheme);

COMMIT;
