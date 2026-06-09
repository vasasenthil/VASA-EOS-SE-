// VASA-EOS(SE) — Architecture Conformance matrix.
//
// Maps the seven pillars of the System Architecture Overview (SAO-TN-001) to the
// concrete components that implement them in this repository, with an honest status
// and any remaining gap. Each component's `ref` points at a real path so the matrix
// is self-verifying (a test asserts every ref exists on disk). Pure data + helpers.

export type PillarStatus = "implemented" | "partial" | "infra-pending"

export interface ArchComponent {
  name: string
  /** Repository path that implements it (asserted to exist by tests). */
  ref: string
}

export interface Pillar {
  id: string
  name: string
  /** The architectural commitment this pillar makes. */
  commitment: string
  components: ArchComponent[]
  status: PillarStatus
  /** What is genuinely not yet done (honest). */
  gap?: string
}

export const PILLARS: Pillar[] = [
  {
    id: "native-ai",
    name: "Native-AI Fabric",
    commitment: "AI woven through the platform: specialised agents, RAG, confidence gating and human-in-the-loop.",
    components: [
      { name: "8 specialised agents + confidence gating + HITL", ref: "lib/agents" },
      { name: "Responsible-AI guardrails (risk→control register)", ref: "lib/agents/guardrails.ts" },
      { name: "Per-agent MCP tool definitions", ref: "lib/agents/tools.ts" },
      { name: "MCP tool dispatcher (HITL-gated)", ref: "lib/agents/dispatch.ts" },
      { name: "Tool executor → real seams (DBT/IVR/translate)", ref: "lib/agents/execute.ts" },
      { name: "HITL tool-approval queue", ref: "lib/agentflow/store.ts" },
      { name: "Agent/LLM live adapter", ref: "lib/integrations/live/agents.ts" },
      { name: "RAG retrieval port (grounding)", ref: "lib/integrations/live/retrieval.ts" },
      { name: "Knowledge graph", ref: "lib/knowledge-graph" },
      { name: "Adaptive learning (BKT/ZPD)", ref: "lib/adaptive" },
    ],
    status: "partial",
    gap: "Real LLM keys + an MCP tool-execution runtime + a production vector store at curriculum scale (tool defs + RAG seam + responsible-AI guardrails now in place).",
  },
  {
    id: "multi-tenancy",
    name: "Multi-Tenancy",
    commitment: "Seven-tier sovereign tenancy (national→state→directorate→district→block→cluster→school) with downward-governance data scoping.",
    components: [
      { name: "7-tier tenant model", ref: "lib/tenancy" },
      { name: "ReBAC data scoping engine", ref: "lib/access/scope.ts" },
      { name: "Scoping enforcement seam", ref: "lib/access/scope-server.ts" },
      { name: "Tenant column migration (45 tables)", ref: "scripts/018-add-tenant-scoping.sql" },
      { name: "RLS-per-tenant (DB defense-in-depth)", ref: "scripts/019-tenant-rls.sql" },
    ],
    status: "implemented",
    gap: "Provisioned database to apply RLS + per-request GUC binding on the non-service connection at deploy.",
  },
  {
    id: "data",
    name: "Data",
    commitment: "Polyglot stores feeding a Bronze/Silver/Gold lakehouse; durable persistence with a tamper-evident ledger.",
    components: [
      { name: "Polyglot + Bronze/Silver/Gold reference", ref: "lib/data" },
      { name: "Medallion data-lineage DAG (dbt-style models)", ref: "lib/data/lineage.ts" },
      { name: "Master-data identifier standards (MDM)", ref: "lib/data/standards.ts" },
      { name: "Durable persistence seam", ref: "lib/persistence" },
      { name: "Hash-chained audit ledger", ref: "lib/audit" },
      { name: "Snapshot stores", ref: "lib/results/store.ts" },
    ],
    status: "partial",
    gap: "Actual multi-store/lakehouse deployment + a running dbt runtime (the model lineage DAG is now modelled in-repo).",
  },
  {
    id: "security",
    name: "Security",
    commitment: "Zero-trust: 5-model access PDP, DPDP consent, immutable audit, MFA/SSO, security headers + rate limiting.",
    components: [
      { name: "5-model PDP (RBAC·ABAC·ReBAC·PBAC·CABAC)", ref: "lib/access/policy.ts" },
      { name: "Role × permission matrix (live from the PDP)", ref: "lib/access/matrix.ts" },
      { name: "DPDP consent + catalogue-driven PII-read gate", ref: "lib/consent/gate-server.ts" },
      { name: "PII data-classification catalogue", ref: "lib/consent/pii-catalogue.ts" },
      { name: "Retention & right-to-erasure schedule (DPDP)", ref: "lib/consent/retention.ts" },
      { name: "Consent-gated student PII reader (minimised)", ref: "lib/consent/student-pii.ts" },
      { name: "DPIA scaffold (generated from PII catalogue)", ref: "lib/consent/dpia.ts" },
      { name: "STRIDE threat model (controls bound to repo paths)", ref: "lib/security/threat-model.ts" },
      { name: "Security headers + request-id", ref: "middleware.ts" },
      { name: "Rate-limit seam", ref: "lib/ratelimit" },
    ],
    status: "partial",
    gap: "WAF / SIEM / Vault-HSM / mTLS are infrastructure to provision at deploy (threat model + mitigations now mapped to controls).",
  },
  {
    id: "operations",
    name: "Operations",
    commitment: "Observability (probes, metrics, logs), service-level objectives, and disaster recovery (RPO/RTO).",
    components: [
      { name: "Readiness/liveness/health/metrics probes", ref: "lib/readiness" },
      { name: "Structured logger + metrics", ref: "lib/metrics" },
      { name: "Live ops console", ref: "app/ops/page.tsx" },
      { name: "DR + SLO posture model", ref: "lib/ops-posture" },
      { name: "SLI catalogue + error budgets (SLO-bound)", ref: "lib/ops-posture/sli.ts" },
      { name: "DR runbook + on-call/SLA (per-scenario procedures)", ref: "lib/ops-posture/runbook.ts" },
      { name: "Tracing seam (OTLP export)", ref: "lib/tracing" },
    ],
    status: "partial",
    gap: "Live OTel collector + log shipping/SIEM, and a DR drill that *exercises* the runbook (runbook + on-call/SLA now modelled).",
  },
  {
    id: "accessibility",
    name: "Accessibility",
    commitment: "21 RPwD categories, WCAG-aligned UX, 22-language multilingual + voice/IVR.",
    components: [
      { name: "App-wide a11y preferences + 14 deep-a11y features", ref: "lib/accessibility" },
      { name: "RPwD Act 2016 — 21 specified disabilities register", ref: "lib/accessibility/rpwd.ts" },
      { name: "Multilingual (react-i18next)", ref: "lib/i18n" },
      { name: "22-language Eighth-Schedule catalogue + TN tribal/minority", ref: "lib/i18n/languages.ts" },
      { name: "Multi-channel & IVR voice access catalogue", ref: "lib/accessibility/channels.ts" },
      { name: "Bhashini language port (translate/TTS/ASR)", ref: "lib/integrations/live/bhashini.ts" },
    ],
    status: "partial",
    gap: "Runtime Braille/ISL/AAC/switch/eye-tracking + a live telephony IVR provider (channels/flows now modelled), full per-language UI string packs, WCAG 2.2 AAA audit.",
  },
  {
    id: "integration",
    name: "Integration",
    commitment: "India-Stack / NDEAR-S ports with mock+live adapters behind a fail-soft transport.",
    components: [
      { name: "11 typed ports + registry", ref: "lib/integrations" },
      { name: "Live HTTP adapters", ref: "lib/integrations/live" },
      { name: "Posture introspection", ref: "lib/integrations/status.ts" },
      { name: "NDEAR compliance register (principles + building blocks)", ref: "lib/compliance/ndear.ts" },
    ],
    status: "implemented",
    gap: "Credentials / MoUs / sandboxes per provider to flip ports from mock to live.",
  },
]

export interface ArchSummary {
  pillars: number
  implemented: number
  partial: number
  infraPending: number
  components: number
}

export function archSummary(pillars: Pillar[] = PILLARS): ArchSummary {
  return {
    pillars: pillars.length,
    implemented: pillars.filter((p) => p.status === "implemented").length,
    partial: pillars.filter((p) => p.status === "partial").length,
    infraPending: pillars.filter((p) => p.status === "infra-pending").length,
    components: pillars.reduce((n, p) => n + p.components.length, 0),
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

/** RFC 4180 CSV of the conformance matrix (one row per component). */
export function toCSV(pillars: Pillar[] = PILLARS): string {
  const header = ["Pillar", "Status", "Component", "Ref", "Gap"]
  const rows: string[] = []
  for (const p of pillars) {
    for (const c of p.components) {
      rows.push([p.name, p.status, c.name, c.ref, p.gap ?? ""].map(csvField).join(","))
    }
  }
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
