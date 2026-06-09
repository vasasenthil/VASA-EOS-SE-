// VASA-EOS(SE) — STRIDE threat model (Security pillar / zero-trust).
//
// A structured threat model for the platform's trust boundaries, classified by STRIDE
// (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service,
// Elevation of privilege). Each threat names the in-repo control that mitigates it via
// a real `controlRef` path — a test asserts every path exists on disk, so the model
// stays honest and self-verifying (the same discipline as the architecture matrix).
// This complements the DPIA (privacy) and the assurance register (independent audits).
// Pure + client-safe. (Infra controls — WAF/SIEM/Vault-HSM/mTLS — are provisioned at
// deploy and are honestly recorded as 'partial' here.)

export type Stride =
  | "spoofing"
  | "tampering"
  | "repudiation"
  | "info-disclosure"
  | "denial-of-service"
  | "elevation"

export type ThreatSeverity = "low" | "medium" | "high" | "critical"
export type MitigationStatus = "mitigated" | "partial" | "accepted"

export interface Threat {
  id: string
  category: Stride
  /** Trust boundary / asset under threat. */
  boundary: string
  threat: string
  severity: ThreatSeverity
  mitigation: string
  /** Repository path of the control implementing the mitigation (asserted to exist). */
  controlRef: string
  status: MitigationStatus
}

export const STRIDE_CATEGORIES: Stride[] = [
  "spoofing",
  "tampering",
  "repudiation",
  "info-disclosure",
  "denial-of-service",
  "elevation",
]

export const THREATS: Threat[] = [
  // Spoofing
  { id: "S1", category: "spoofing", boundary: "Authn / session", threat: "Impersonating a user or assuming another role", severity: "high", mitigation: "5-model access PDP (RBAC·ABAC·ReBAC·PBAC·CABAC); deny-wins evaluation", controlRef: "lib/access/policy.ts", status: "mitigated" },
  { id: "S2", category: "spoofing", boundary: "Identity (APAAR/Aadhaar)", threat: "Forged learner identity at provisioning", severity: "high", mitigation: "Aadhaar verify-only (never stored) + AI dedup before APAAR issue", controlRef: "lib/integrations/live/aadhaar.ts", status: "partial" },

  // Tampering
  { id: "T1", category: "tampering", boundary: "Records / audit ledger", threat: "Altering records or covering tracks post-hoc", severity: "critical", mitigation: "Hash-chained, append-only tamper-evident audit ledger", controlRef: "lib/audit/trail.ts", status: "mitigated" },
  { id: "T2", category: "tampering", boundary: "HTTP request / headers", threat: "Header/parameter tampering, clickjacking, MIME sniff", severity: "medium", mitigation: "Security headers + request-id in middleware", controlRef: "middleware.ts", status: "mitigated" },
  { id: "T3", category: "tampering", boundary: "Cross-tenant DB rows", threat: "Writing/reading another tenant's rows directly", severity: "high", mitigation: "RLS-per-tenant (in_tenant_subtree) defense-in-depth", controlRef: "scripts/019-tenant-rls.sql", status: "partial" },

  // Repudiation
  { id: "R1", category: "repudiation", boundary: "High-stakes actions (DBT, approvals)", threat: "Denying a disbursement/approval was made", severity: "high", mitigation: "Every state change appended to the tamper-evident audit trail", controlRef: "lib/audit/trail.ts", status: "mitigated" },

  // Information disclosure
  { id: "I1", category: "info-disclosure", boundary: "Student PII reads", threat: "Releasing PII without lawful consent", severity: "critical", mitigation: "Catalogue-driven consent gate (fail-closed) + minimised projection", controlRef: "lib/consent/gate-server.ts", status: "mitigated" },
  { id: "I2", category: "info-disclosure", boundary: "Per-role data scope", threat: "A subject seeing data outside its jurisdiction", severity: "high", mitigation: "ReBAC downward-governance scoping (fail-closed)", controlRef: "lib/access/scope.ts", status: "mitigated" },
  { id: "I3", category: "info-disclosure", boundary: "Source repository / CI", threat: "Committed credentials / secret leakage", severity: "high", mitigation: "Secret-leak scan gate in CI", controlRef: "scripts/secret-scan.mjs", status: "mitigated" },

  // Denial of service
  { id: "D1", category: "denial-of-service", boundary: "Public APIs / login", threat: "Request flooding / brute force", severity: "medium", mitigation: "Rate-limit seam (per-principal throttling)", controlRef: "lib/ratelimit", status: "partial" },
  { id: "D2", category: "denial-of-service", boundary: "Service availability", threat: "Resource exhaustion breaching SLOs", severity: "medium", mitigation: "SLO/DR posture + health probes + auto-roll replicas", controlRef: "lib/ops-posture", status: "partial" },

  // Elevation of privilege
  { id: "E1", category: "elevation", boundary: "Authorization decision", threat: "Escalating to an action not granted", severity: "critical", mitigation: "Deny-wins PDP; high-stakes actions require explicit grant", controlRef: "lib/access/policy.ts", status: "mitigated" },
  { id: "E2", category: "elevation", boundary: "AI agent tool execution", threat: "An agent executing a privileged tool autonomously", severity: "high", mitigation: "HITL-gated MCP tool dispatch + human approval queue", controlRef: "lib/agents/dispatch.ts", status: "mitigated" },
]

export function threatById(id: string): Threat | undefined {
  return THREATS.find((t) => t.id === id)
}

export function byCategory(category: Stride): Threat[] {
  return THREATS.filter((t) => t.category === category)
}

/** STRIDE categories that have no modelled threat (should be none). */
export function uncoveredCategories(): Stride[] {
  return STRIDE_CATEGORIES.filter((c) => byCategory(c).length === 0)
}

export interface ThreatSummary {
  threats: number
  categories: number
  mitigated: number
  partial: number
  accepted: number
  critical: number
}

export function threatSummary(items: Threat[] = THREATS): ThreatSummary {
  return {
    threats: items.length,
    categories: new Set(items.map((t) => t.category)).size,
    mitigated: items.filter((t) => t.status === "mitigated").length,
    partial: items.filter((t) => t.status === "partial").length,
    accepted: items.filter((t) => t.status === "accepted").length,
    critical: items.filter((t) => t.severity === "critical").length,
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(items: Threat[] = THREATS): string {
  const header = ["ID", "STRIDE", "Boundary", "Threat", "Severity", "Mitigation", "Control", "Status"]
  const rows = items.map((t) =>
    [t.id, t.category, t.boundary, t.threat, t.severity, t.mitigation, t.controlRef, t.status].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
