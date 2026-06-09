// VASA-EOS(SE) — welfare leakage-prevention controls ("every rupee reaches every child").
//
// Tamil Nadu spends thousands of crores on education welfare; the moral crisis is leakage.
// This maps each leakage / fraud VECTOR to the in-repo control that closes it — APAAR+
// Aadhaar deduplication (ghost beneficiaries), AI cross-scheme anomaly detection, DBT-APBS
// direct transfer (no intermediary), the hash-chained CAG-ready ledger (record tampering),
// and real-time utilisation visibility (opacity). Every controlRef is asserted to exist on
// disk (self-verifying); controls that need a live provider at deploy are honestly 'partial'.
// Pure + client-safe.

export type LeakageStatus = "enforced" | "partial"

export interface LeakageControl {
  id: string
  /** The leakage / fraud vector being closed. */
  vector: string
  /** The mechanism that prevents it. */
  control: string
  /** In-repo evidence path (asserted to exist on disk). */
  controlRef: string
  status: LeakageStatus
}

export const LEAKAGE_CONTROLS: LeakageControl[] = [
  { id: "ghost-beneficiaries", vector: "Ghost beneficiaries — non-existent students drawing benefits", control: "APAAR + Aadhaar biometric deduplication: one child, one identity, one set of entitlements", controlRef: "lib/integrations/live/aadhaar.ts", status: "partial" },
  { id: "double-claims", vector: "Double-claims / impersonation across schemes", control: "AI duplicate detection before a lifelong APAAR id is issued", controlRef: "lib/integrations/live/apaar.ts", status: "partial" },
  { id: "cross-scheme-fraud", vector: "Cross-scheme fraud — same account claiming in multiple districts", control: "Analytics agent flags cross-scheme anomalies human auditors miss", controlRef: "lib/agents/catalogue.ts", status: "partial" },
  { id: "middlemen", vector: "Middlemen / intermediaries skimming before the child", control: "DBT-APBS direct transfer: Treasury → beneficiary account, no intermediary", controlRef: "lib/integrations/live/dbt.ts", status: "partial" },
  { id: "record-tampering", vector: "Altered / backdated / destroyed scheme records", control: "Hash-chained tamper-evident ledger — CAG-audit-ready, cannot be altered", controlRef: "lib/audit/trail.ts", status: "enforced" },
  { id: "opacity", vector: "Opacity — no live visibility into utilisation", control: "Scheme-leakage analytics (Gold) + real-time utilisation dashboards", controlRef: "lib/data/lineage.ts", status: "partial" },
]

export function controlById(id: string): LeakageControl | undefined {
  return LEAKAGE_CONTROLS.find((c) => c.id === id)
}

export function byStatus(status: LeakageStatus): LeakageControl[] {
  return LEAKAGE_CONTROLS.filter((c) => c.status === status)
}

export interface LeakageSummary {
  controls: number
  enforced: number
  partial: number
  /** Target leakage reduction quoted by the programme (illustrative). */
  targetLeakageReductionPct: number
}

export function leakageSummary(items: LeakageControl[] = LEAKAGE_CONTROLS): LeakageSummary {
  return {
    controls: items.length,
    enforced: items.filter((c) => c.status === "enforced").length,
    partial: items.filter((c) => c.status === "partial").length,
    targetLeakageReductionPct: 85,
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(items: LeakageControl[] = LEAKAGE_CONTROLS): string {
  const header = ["Vector", "Control", "Component", "Status"]
  const rows = items.map((c) => [c.vector, c.control, c.controlRef, c.status].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
