// VASA-EOS(SE) — NDEAR / NDEAR-S compliance register (Integration & standards).
//
// The National Digital Education Architecture (NDEAR, NEP 2020) defines a set of design
// PRINCIPLES and unbundled BUILDING BLOCKS for an interoperable, federated education
// ecosystem. This maps each to the platform component that satisfies it, with an honest
// status and a real componentRef path (a test asserts every path exists on disk, like
// the architecture matrix and threat model). It is the concrete answer to the policy
// brief's "NDEAR Compliance & Global Standards". Pure + client-safe.

export type NdearKind = "principle" | "building-block"
export type NdearStatus = "implemented" | "partial" | "infra-pending"

export interface NdearItem {
  id: string
  kind: NdearKind
  name: string
  /** What NDEAR asks for. */
  requirement: string
  /** Platform component satisfying it (asserted to exist on disk). */
  componentRef: string
  status: NdearStatus
}

export const NDEAR_REGISTER: NdearItem[] = [
  // Design principles
  { id: "federated", kind: "principle", name: "Federated, ecosystem architecture", requirement: "No central monolith; sovereign tiers federate (state→…→school)", componentRef: "lib/tenancy", status: "implemented" },
  { id: "interoperable", kind: "principle", name: "Interoperability & open standards", requirement: "Open, typed APIs with mock+live adapters per provider", componentRef: "lib/integrations", status: "implemented" },
  { id: "minimal-evolving", kind: "principle", name: "Minimalist & evolving (unbundled)", requirement: "Independent building blocks, each replaceable", componentRef: "lib/integrations", status: "implemented" },
  { id: "privacy-by-design", kind: "principle", name: "Privacy & security by design", requirement: "Consent-first PII, DPDP, audit, zero-trust", componentRef: "lib/consent/gate-server.ts", status: "implemented" },
  { id: "security", kind: "principle", name: "Security & trust", requirement: "Threat-modelled controls, tamper-evident audit", componentRef: "lib/security/threat-model.ts", status: "partial" },
  { id: "inclusion", kind: "principle", name: "Diversity, inclusion & accessibility", requirement: "21 RPwD categories + WCAG-aligned UX", componentRef: "lib/accessibility/rpwd.ts", status: "partial" },
  { id: "multilingual", kind: "principle", name: "Multilingualism", requirement: "Eighth-Schedule 22-language support", componentRef: "lib/i18n/languages.ts", status: "partial" },
  { id: "verifiable", kind: "principle", name: "Verifiable, learner-held credentials", requirement: "Tamper-evident, portable credentials", componentRef: "lib/credentials", status: "partial" },

  // Unbundled building blocks
  { id: "bb-identity", kind: "building-block", name: "Identity — APAAR", requirement: "Federated lifelong learner ID", componentRef: "lib/integrations", status: "partial" },
  { id: "bb-registries", kind: "building-block", name: "Registries — UDISE+", requirement: "School & enrolment registry of record", componentRef: "lib/integrations/live/udise.ts", status: "partial" },
  { id: "bb-content", kind: "building-block", name: "Content — DIKSHA", requirement: "Federated content/energised-textbook access", componentRef: "lib/integrations/live/diksha.ts", status: "partial" },
  { id: "bb-credentials", kind: "building-block", name: "Credentials — DigiLocker", requirement: "Issue/verify portable credentials", componentRef: "lib/integrations/live/digilocker.ts", status: "partial" },
  { id: "bb-payments", kind: "building-block", name: "Payments — DBT", requirement: "Direct benefit transfer for schemes", componentRef: "lib/integrations/live/dbt.ts", status: "partial" },
  { id: "bb-consent", kind: "building-block", name: "Consent", requirement: "Electronic consent (grant/withdraw) ledger", componentRef: "lib/consent", status: "implemented" },
  { id: "bb-analytics", kind: "building-block", name: "Analytics — VSK", requirement: "Aggregated dashboards / decision support", componentRef: "lib/data/lineage.ts", status: "partial" },
  { id: "bb-knowledge", kind: "building-block", name: "Knowledge graph", requirement: "Curriculum/career semantic graph", componentRef: "lib/knowledge-graph", status: "partial" },
  { id: "bb-audit", kind: "building-block", name: "Audit / transparency", requirement: "Tamper-evident ledger of state changes", componentRef: "lib/audit", status: "implemented" },
]

export function ndearById(id: string): NdearItem | undefined {
  return NDEAR_REGISTER.find((n) => n.id === id)
}

export function byKind(kind: NdearKind): NdearItem[] {
  return NDEAR_REGISTER.filter((n) => n.kind === kind)
}

export interface NdearSummary {
  total: number
  principles: number
  buildingBlocks: number
  implemented: number
  partial: number
  infraPending: number
  /** % of items at least partially in place (implemented + partial). */
  coveragePct: number
}

export function ndearSummary(items: NdearItem[] = NDEAR_REGISTER): NdearSummary {
  const implemented = items.filter((n) => n.status === "implemented").length
  const partial = items.filter((n) => n.status === "partial").length
  return {
    total: items.length,
    principles: items.filter((n) => n.kind === "principle").length,
    buildingBlocks: items.filter((n) => n.kind === "building-block").length,
    implemented,
    partial,
    infraPending: items.filter((n) => n.status === "infra-pending").length,
    coveragePct: items.length === 0 ? 0 : Math.round(((implemented + partial) / items.length) * 100),
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(items: NdearItem[] = NDEAR_REGISTER): string {
  const header = ["ID", "Kind", "Name", "NDEAR requirement", "Component", "Status"]
  const rows = items.map((n) =>
    [n.id, n.kind, n.name, n.requirement, n.componentRef, n.status].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
