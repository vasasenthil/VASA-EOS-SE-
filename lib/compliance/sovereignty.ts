// VASA-EOS(SE) — the Five Sovereignty Guarantees (trust architecture).
//
// The recommendation to the State frames five structural guarantees as "the architecture
// of trust between a government and its people": Data Sovereignty, Off-Switch, Source-Code
// Escrow, Audit-by-Construction, and Evidence-Gated Rollout. These are not contractual
// prose here — each is bound to the in-repo mechanism that makes it real, via a controlRef
// path a test asserts exists on disk (self-verifying, like the architecture matrix). Items
// that finish at deploy (data residency, the legal escrow, independent evaluation) are
// honestly recorded as 'partial'. Pure + client-safe.

import { csvField } from "@/lib/csv"

export type GuaranteeStatus = "enforced" | "partial"

export interface SovereigntyGuarantee {
  id: string
  name: string
  /** What it guarantees to the State. */
  promise: string
  /** How the platform makes it real. */
  mechanism: string
  /** In-repo evidence path (asserted to exist on disk). */
  controlRef: string
  status: GuaranteeStatus
  /** What remains to fully honour it (honest). */
  remaining?: string
}

export const SOVEREIGNTY_GUARANTEES: SovereigntyGuarantee[] = [
  {
    id: "data-sovereignty",
    name: "Data Sovereignty",
    promise: "Tamil Nadu owns all education data — on TN soil, under TN law, always.",
    mechanism: "Sovereign multi-tenancy with TN as the primary tenant; downward-governance ReBAC scoping; the state owns the schema and the data.",
    controlRef: "lib/tenancy/catalogue.ts",
    status: "partial",
    remaining: "Sovereign-cloud / on-prem data residency provisioned at deploy.",
  },
  {
    id: "off-switch",
    name: "Off-Switch",
    promise: "Tamil Nadu can halt at every phase boundary — no lock-in, no trapped investment.",
    mechanism: "Every external dependency is a fail-soft port with a mock fallback; the platform runs end-to-end with no vendor connected, and INTEGRATION_* flags toggle each port off.",
    controlRef: "lib/integrations",
    status: "enforced",
  },
  {
    id: "source-code-escrow",
    name: "Source-Code Escrow",
    promise: "The entire platform is operable by Tamil Nadu independently of the vendor.",
    mechanism: "Full source in-repo, no closed binaries; a reproducible standalone container the state can build and self-host.",
    controlRef: "Dockerfile",
    status: "partial",
    remaining: "Executed escrow agreement + state-operated build/release pipeline.",
  },
  {
    id: "audit-by-construction",
    name: "Audit-by-Construction",
    promise: "Every AI decision and automated action is an immutable record — no black box.",
    mechanism: "Hash-chained, tamper-evident audit ledger; agent decisions, tool calls and PII reads are all appended and verifiable.",
    controlRef: "lib/audit/trail.ts",
    status: "enforced",
  },
  {
    id: "evidence-gated-rollout",
    name: "Evidence-Gated Rollout",
    promise: "Nothing scales beyond pilot without independently-verified results.",
    mechanism: "An independent-assurance register gates go-live; the audits a government must commission are recorded honestly as not-started until evidenced.",
    controlRef: "lib/assurance/index.ts",
    status: "partial",
    remaining: "Independent quarterly evaluation + CAG-ready evidence exercised against pilots.",
  },
]

export function guaranteeById(id: string): SovereigntyGuarantee | undefined {
  return SOVEREIGNTY_GUARANTEES.find((g) => g.id === id)
}

export interface SovereigntySummary {
  guarantees: number
  enforced: number
  partial: number
}

export function sovereigntySummary(items: SovereigntyGuarantee[] = SOVEREIGNTY_GUARANTEES): SovereigntySummary {
  return {
    guarantees: items.length,
    enforced: items.filter((g) => g.status === "enforced").length,
    partial: items.filter((g) => g.status === "partial").length,
  }
}


export function toCSV(items: SovereigntyGuarantee[] = SOVEREIGNTY_GUARANTEES): string {
  const header = ["Guarantee", "Promise", "Mechanism", "Control", "Status", "Remaining"]
  const rows = items.map((g) =>
    [g.name, g.promise, g.mechanism, g.controlRef, g.status, g.remaining ?? "—"].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
