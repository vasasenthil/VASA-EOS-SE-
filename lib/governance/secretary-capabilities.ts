// VASA-EOS(SE) — Secretary (School Education) capability register ("what the office can actually do, honestly").
//
// The truthful answer to "is every Secretary feature built?" — made inspectable rather than asserted.
// Each general / technical / functional responsibility of the Secretary, School Education (the state-tier
// administrative head governing all 7 directorates) is mapped to the in-repo feature that delivers it, with
// an honest status: 'built' (working slice on seeded data), 'partial' (exists but Secretary-tier depth
// pending) or 'pending' (not yet built — and therefore carrying NO feature reference, so this register can
// never fake coverage). A test asserts every built/partial featureRef exists on disk AND that every pending
// item references nothing. Pure + client-safe.

export type CapabilityStatus = "built" | "partial" | "pending"
export type CapabilityDimension = "general" | "technical" | "functional"

export interface SecretaryCapability {
  id: string
  dimension: CapabilityDimension
  /** The Secretary responsibility. */
  responsibility: string
  /** The in-repo feature delivering it — empty string when pending (honestly nothing yet). */
  featureRef: string
  /** In-app route, when one exists. */
  route: string
  status: CapabilityStatus
}

export const SECRETARY_CAPABILITIES: SecretaryCapability[] = [
  // General — leadership, oversight, jurisdiction
  { id: "state-dashboard", dimension: "general", responsibility: "State-wide visibility dashboard across all 7 directorates", featureRef: "app/secretary/dashboard/page.tsx", route: "/secretary/dashboard", status: "built" },
  { id: "all-directorate-kpis", dimension: "general", responsibility: "Consolidated all-directorate KPI rollup", featureRef: "app/governance/dashboard/page.tsx", route: "/governance/dashboard", status: "built" },
  { id: "approvals-oversight", dimension: "general", responsibility: "Oversee every approval in flight statewide", featureRef: "lib/governance/oversight.ts", route: "/governance/oversight", status: "built" },
  { id: "org-structure", dimension: "general", responsibility: "Government structure / org-hierarchy command of the department", featureRef: "app/governance/org/page.tsx", route: "/governance/org", status: "built" },
  { id: "jurisdiction-scope", dimension: "general", responsibility: "State-tier jurisdiction — govern TN node and all descendants", featureRef: "lib/access/scope.ts", route: "/governance/scope", status: "built" },
  { id: "forum-authority", dimension: "general", responsibility: "Convene forums and exercise RACI quorum authority", featureRef: "app/governance/forums/page.tsx", route: "/governance/forums", status: "built" },
  { id: "interdept-coordination", dimension: "general", responsibility: "Inter-departmental & CSR / donor coordination workspace", featureRef: "", route: "", status: "pending" },

  // Technical — platform mechanisms the office relies on
  { id: "access-pdp", dimension: "technical", responsibility: "Role-based authority via the 5-model access PDP", featureRef: "lib/access/policy.ts", route: "/governance/access", status: "built" },
  { id: "audit-trail", dimension: "technical", responsibility: "Tamper-evident audit of state-tier decisions", featureRef: "lib/audit/trail.ts", route: "/governance/oversight", status: "built" },
  { id: "traceability", dimension: "technical", responsibility: "Requirements traceability of the office's user stories", featureRef: "lib/traceability/index.ts", route: "/governance/traceability", status: "built" },
  { id: "data-lineage", dimension: "technical", responsibility: "Single-source-of-truth data lineage feeding every figure", featureRef: "lib/data/lineage.ts", route: "/data-lineage", status: "built" },
  { id: "identity-directory", dimension: "technical", responsibility: "Identity & directory binding every role under the office", featureRef: "lib/directory/index.ts", route: "/governance/directory", status: "built" },

  // Functional — the actual administrative work of the office
  { id: "nep-analytics", dimension: "functional", responsibility: "NEP / SEP implementation analytics statewide", featureRef: "lib/tracking/analytics.ts", route: "/tracking/analytics", status: "built" },
  { id: "scheme-impact", dimension: "functional", responsibility: "Scheme impact dashboards (Samagra Shiksha, PM POSHAN, etc.)", featureRef: "app/schemes/page.tsx", route: "/schemes", status: "built" },
  { id: "policies-circulars", dimension: "functional", responsibility: "Policies & circulars issuance and tracking", featureRef: "app/policies/page.tsx", route: "/policies", status: "built" },
  { id: "risk-register", dimension: "functional", responsibility: "Statewide risk register of implementation challenges", featureRef: "app/tracking/challenges/page.tsx", route: "/tracking/challenges", status: "built" },
  { id: "grievance-disposal", dimension: "functional", responsibility: "State-tier grievance escalation & disposal", featureRef: "lib/grievance/index.ts", route: "/grievance", status: "partial" },
  { id: "recognition-oversight", dimension: "functional", responsibility: "School recognition / approvals oversight", featureRef: "lib/recognition/index.ts", route: "/recognition", status: "partial" },
  { id: "cadre-postings", dimension: "functional", responsibility: "Cadre management & transfer-posting policy at scale", featureRef: "lib/postings/index.ts", route: "/postings", status: "partial" },
  { id: "budget-sanction", dimension: "functional", responsibility: "Budget sanction, allocation & re-appropriation authority", featureRef: "", route: "", status: "pending" },
  { id: "assembly-prep", dimension: "functional", responsibility: "Assembly / legislative Q&A briefing-pack preparation", featureRef: "lib/governance/assembly-briefing.ts", route: "/governance/assembly-briefing", status: "built" },
  { id: "cabinet-notes", dimension: "functional", responsibility: "Cabinet-note / policy-drafting tooling", featureRef: "", route: "", status: "pending" },
]

export function capabilityById(id: string): SecretaryCapability | undefined {
  return SECRETARY_CAPABILITIES.find((c) => c.id === id)
}

export function byStatus(status: CapabilityStatus): SecretaryCapability[] {
  return SECRETARY_CAPABILITIES.filter((c) => c.status === status)
}

export function byDimension(dimension: CapabilityDimension): SecretaryCapability[] {
  return SECRETARY_CAPABILITIES.filter((c) => c.dimension === dimension)
}

export interface SecretaryCapabilitySummary {
  capabilities: number
  built: number
  partial: number
  pending: number
  /** Share of the surface that is built (working slice), 0–100. */
  builtPct: number
  general: number
  technical: number
  functional: number
}

export function secretaryCapabilitySummary(items: SecretaryCapability[] = SECRETARY_CAPABILITIES): SecretaryCapabilitySummary {
  const built = items.filter((c) => c.status === "built").length
  return {
    capabilities: items.length,
    built,
    partial: items.filter((c) => c.status === "partial").length,
    pending: items.filter((c) => c.status === "pending").length,
    builtPct: items.length === 0 ? 0 : Math.round((built / items.length) * 100),
    general: items.filter((c) => c.dimension === "general").length,
    technical: items.filter((c) => c.dimension === "technical").length,
    functional: items.filter((c) => c.dimension === "functional").length,
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(items: SecretaryCapability[] = SECRETARY_CAPABILITIES): string {
  const header = ["Dimension", "Responsibility", "Feature", "Route", "Status"]
  const rows = items.map((c) => [c.dimension, c.responsibility, c.featureRef || "—", c.route || "—", c.status].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
