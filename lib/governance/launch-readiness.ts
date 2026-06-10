// VASA-EOS(SE) — launch / government / deployment readiness register (the honest scorecard, made inspectable).
//
// docs/PRODUCTION-READINESS.md states the verdict in prose; this makes it a quantified, self-verifying register.
// Each criterion a genuine state-wide government deployment requires is scored done / partial / not-started, with
// in-repo evidence where a claim is made (asserted to exist on disk) and NO evidence where it is not-started — so
// the register cannot inflate readiness. The honest truth this surfaces: the platform is a broad, well-tested MVP,
// NOT yet government-grade, because the largest remaining gates (real data, live integrations, sovereign hosting,
// security/DPDP audit, scale testing) are organisational and infrastructural, not more TypeScript. Pure + client-safe.

import { csvField } from "@/lib/csv"

export type ReadinessStatus = "done" | "partial" | "not-started"

export type ReadinessCategory =
  | "Real data"
  | "Live integrations"
  | "Security & privacy"
  | "Hosting & infrastructure"
  | "Scale & performance"
  | "Observability & DR"
  | "Compliance & assurance"
  | "Persistence & access"
  | "Quality & testing"

export interface ReadinessCriterion {
  id: string
  category: ReadinessCategory
  criterion: string
  status: ReadinessStatus
  /** What remains, or what exists. */
  note: string
  /** In-repo evidence (asserted to exist for done/partial; empty for not-started). */
  evidenceRef: string
}

export const READINESS_CRITERIA: ReadinessCriterion[] = [
  // Real data — the central gap (scoped state-wide, not a pilot)
  { id: "udise-registry", category: "Real data", criterion: "Real UDISE+/EMIS school registry loaded (state-wide)", status: "not-started", note: "Ingestion adapter is ready (see ingestion-adapter); still needs the actual ~50k-school export to be supplied and loaded", evidenceRef: "" },
  { id: "sis-records", category: "Real data", criterion: "Real student records (SIS) at scale (~1 crore)", status: "not-started", note: "7 seed students; needs real enrolment import", evidenceRef: "" },
  { id: "teacher-rosters", category: "Real data", criterion: "Real teacher rosters & sanctioned posts", status: "not-started", note: "Illustrative cadre data only", evidenceRef: "" },
  { id: "data-mous", category: "Real data", criterion: "Data-sharing MoUs with TN departments", status: "not-started", note: "Organisational; not a code task", evidenceRef: "" },
  { id: "ingestion-adapter", category: "Real data", criterion: "Ingestion adapter + schema mapping + validation + idempotent load", status: "done", note: "Schema-driven CSV pipeline with validation and idempotent upsert; UDISE+ school adapter is the reference template, tested", evidenceRef: "lib/ingestion/index.ts" },

  // Live integrations
  { id: "india-stack-live", category: "Live integrations", criterion: "India-Stack live (APAAR/Aadhaar/DigiLocker/DBT/UDISE+)", status: "partial", note: "Live HTTP adapters exist behind the seam; need credentials/MoUs/sandboxes", evidenceRef: "lib/integrations/live" },
  { id: "bhashini-asr", category: "Live integrations", criterion: "Bhashini live ASR (raw-audio pipeline)", status: "not-started", note: "Translate/TTS live; ASR pipeline pending", evidenceRef: "" },

  // Security & privacy
  { id: "security-audit", category: "Security & privacy", criterion: "Independent security audit (SAST/DAST/pentest)", status: "not-started", note: "Not performed", evidenceRef: "" },
  { id: "production-auth", category: "Security & privacy", criterion: "Production auth (SSO/MFA), not the demo password", status: "partial", note: "Auth seam + demo fallback exist; real IdP/MFA not wired", evidenceRef: "lib/demo-auth/index.ts" },
  { id: "secrets-mgmt", category: "Security & privacy", criterion: "Secrets management (Vault/HSM)", status: "partial", note: "Provider-abstracted secrets seam with redaction + presence-only report (env-backed); real Vault/HSM provisioning pending", evidenceRef: "lib/secrets/index.ts" },
  { id: "zero-trust-infra", category: "Security & privacy", criterion: "Zero-trust infra (WAF/SIEM/mTLS)", status: "not-started", note: "Documented; not provisioned", evidenceRef: "" },
  { id: "dpdp-audit", category: "Security & privacy", criterion: "DPDP compliance audit (children's data)", status: "not-started", note: "Consent/PII modelled; independent audit pending", evidenceRef: "" },
  { id: "audit-ledger", category: "Security & privacy", criterion: "Tamper-evident audit ledger", status: "done", note: "Hash-chained, verified, tested", evidenceRef: "lib/audit/trail.ts" },

  // Hosting & infrastructure
  { id: "sovereign-hosting", category: "Hosting & infrastructure", criterion: "Sovereign cloud hosting (TN SDC / MeitY)", status: "not-started", note: "Runs on managed non-sovereign cloud", evidenceRef: "" },
  { id: "container-iac", category: "Hosting & infrastructure", criterion: "Container / IaC (Dockerfile, Terraform)", status: "partial", note: "Dockerfile (multi-stage, non-root, standalone) + k8s manifests + docker-compose + Terraform skeleton checked in (deploy/); provider blocks pending the chosen sovereign cloud", evidenceRef: "deploy/terraform/main.tf" },

  // Scale & performance
  { id: "db-provisioned", category: "Scale & performance", criterion: "Durable database provisioned + migrations run", status: "partial", note: "Migrations exist for all schema incl. the six workflow-backed transactional flow tables; scripts/021 verified against PostgreSQL 16 (tables + RLS deny-by-default + service-role round-trip); managed instance not yet provisioned at scale", evidenceRef: "scripts/021-create-workflow-flow-tables.sql" },
  { id: "load-testing", category: "Scale & performance", criterion: "Load/performance testing at state scale", status: "not-started", note: "Not done", evidenceRef: "" },

  // Observability & DR
  { id: "logging-probes-metrics", category: "Observability & DR", criterion: "Structured logging, liveness/readiness probes, metrics", status: "done", note: "logger + readiness + Prometheus metrics, tested", evidenceRef: "lib/readiness" },
  { id: "siem-otel", category: "Observability & DR", criterion: "Centralised log shipping / SIEM / OTel traces", status: "partial", note: "ECS-schema SIEM exporter seam (NDJSON, severity, endpoint-gated) checked in; a live collector (Splunk/Elastic/Wazuh) + OTel trace export still to provision", evidenceRef: "lib/observability/siem.ts" },
  { id: "dr-runbook", category: "Observability & DR", criterion: "DR runbook + backups, exercised", status: "partial", note: "Runbook modelled in-repo; not exercised against real infra", evidenceRef: "lib/ops-posture/runbook.ts" },

  // Compliance & assurance
  { id: "compliance-register", category: "Compliance & assurance", criterion: "Multi-framework compliance register", status: "done", note: "NEP/DPDP/RPwD/RTE/POCSO/ISO/WCAG/SDG mapped, self-verifying", evidenceRef: "lib/compliance/index.ts" },
  { id: "assurance-signoff", category: "Compliance & assurance", criterion: "Independent assurance / audit sign-off", status: "not-started", note: "Self-assessed only", evidenceRef: "" },
  { id: "wcag-audit", category: "Compliance & assurance", criterion: "WCAG 2.2 + screen-reader audit", status: "not-started", note: "A11y built; formal audit pending", evidenceRef: "" },

  // Persistence & access
  { id: "persistence-seam", category: "Persistence & access", criterion: "Durable persistence seam + CRUD pattern", status: "done", note: "getDb() + store.ts pattern, tested", evidenceRef: "lib/persistence/index.ts" },
  { id: "all-modules-persisted", category: "Persistence & access", criterion: "Every interactive module persisted (not in-browser state)", status: "partial", note: "~53 modules persisted; ~21 still hold browser state", evidenceRef: "lib/persistence/index.ts" },
  { id: "access-on-writes", category: "Persistence & access", criterion: "Access enforcement on every write", status: "partial", note: "Enforced on high-stakes writes; not uniform", evidenceRef: "lib/access/policy.ts" },

  // Quality & testing
  { id: "unit-coverage", category: "Quality & testing", criterion: "Automated tests + enforced coverage gate", status: "done", note: "900+ tests, ~97% lines, CI-gated", evidenceRef: "lib/compliance/index.ts" },
  { id: "e2e-tests", category: "Quality & testing", criterion: "End-to-end tests beyond the unit suite", status: "partial", note: "Cross-module integration scenarios (ingest→join→reload, self-assessment consistency); a browser/Playwright E2E suite is still pending", evidenceRef: "tests/e2e-scenario.test.ts" },
]

const SCORE: Record<ReadinessStatus, number> = { done: 1, partial: 0.5, "not-started": 0 }

export function criterionById(id: string): ReadinessCriterion | undefined {
  return READINESS_CRITERIA.find((c) => c.id === id)
}

export function byStatus(status: ReadinessStatus): ReadinessCriterion[] {
  return READINESS_CRITERIA.filter((c) => c.status === status)
}

export interface CategoryReadiness {
  category: ReadinessCategory
  criteria: number
  done: number
  partial: number
  notStarted: number
  /** Weighted readiness for the category, 0–100. */
  readinessPct: number
}

export const READINESS_CATEGORIES: ReadinessCategory[] = [
  "Real data",
  "Live integrations",
  "Security & privacy",
  "Hosting & infrastructure",
  "Scale & performance",
  "Observability & DR",
  "Compliance & assurance",
  "Persistence & access",
  "Quality & testing",
]

export function readinessByCategory(items: ReadinessCriterion[] = READINESS_CRITERIA): CategoryReadiness[] {
  return READINESS_CATEGORIES.map((category) => {
    const rows = items.filter((c) => c.category === category)
    const score = rows.reduce((s, c) => s + SCORE[c.status], 0)
    return {
      category,
      criteria: rows.length,
      done: rows.filter((c) => c.status === "done").length,
      partial: rows.filter((c) => c.status === "partial").length,
      notStarted: rows.filter((c) => c.status === "not-started").length,
      readinessPct: rows.length === 0 ? 0 : Math.round((score / rows.length) * 100),
    }
  })
}

export interface ReadinessSummary {
  criteria: number
  done: number
  partial: number
  notStarted: number
  /** Overall weighted readiness, 0–100 (done=1, partial=0.5, not-started=0). */
  overallReadinessPct: number
}

export function readinessSummary(items: ReadinessCriterion[] = READINESS_CRITERIA): ReadinessSummary {
  const score = items.reduce((s, c) => s + SCORE[c.status], 0)
  return {
    criteria: items.length,
    done: items.filter((c) => c.status === "done").length,
    partial: items.filter((c) => c.status === "partial").length,
    notStarted: items.filter((c) => c.status === "not-started").length,
    overallReadinessPct: items.length === 0 ? 0 : Math.round((score / items.length) * 100),
  }
}


export function toCSV(items: ReadinessCriterion[] = READINESS_CRITERIA): string {
  const header = ["Category", "Criterion", "Status", "Note", "Evidence"]
  const rows = items.map((c) => [c.category, c.criterion, c.status, c.note, c.evidenceRef || "—"].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
