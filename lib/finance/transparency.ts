// VASA-EOS(SE) — financial transparency & accountability register ("public money, in public view").
//
// Where the leakage register stops fraud, this register makes the public purse *legible*: every
// fiscal-accountability PRINCIPLE the state owes its citizens — visible budgets, live utilisation,
// direct transfer, open procurement, disclosed fees, traceable scholarships, accounted assets,
// community oversight, statutory audit and the right to information — mapped to the in-repo
// mechanism that delivers it and the framework/authority (PFMS·IFHRMS·CAG·GeM·DBT·RTI) it answers
// to. Every controlRef is asserted to exist on disk (self-verifying); principles needing a live
// government rail at deploy (PFMS utilisation feed, DBT-APBS) are honestly 'partial'. Pure + client-safe.

export type FinTransparencyStatus = "enforced" | "partial"

export interface FinTransparencyControl {
  id: string
  /** The fiscal-accountability principle owed to citizens. */
  principle: string
  /** The framework / authority it answers to. */
  framework: string
  /** The in-repo mechanism that delivers it. */
  mechanism: string
  /** In-repo evidence path (asserted to exist on disk). */
  controlRef: string
  status: FinTransparencyStatus
}

export const FIN_TRANSPARENCY_CONTROLS: FinTransparencyControl[] = [
  { id: "budget-visibility", principle: "Every budget head and allocation is publicly visible", framework: "PFMS · IFHRMS", mechanism: "School financial register — budget heads, allocation and expenditure", controlRef: "lib/finance/index.ts", status: "enforced" },
  { id: "utilisation-tracking", principle: "Live utilisation vs allocation — no idle or unaccounted funds", framework: "PFMS", mechanism: "Gold-tier utilisation lineage feeding real-time spend dashboards", controlRef: "lib/data/lineage.ts", status: "partial" },
  { id: "direct-transfer", principle: "Entitlements paid direct to the beneficiary, no intermediary", framework: "DBT · APBS", mechanism: "Student banking register binding accounts for direct transfer", controlRef: "lib/banking/index.ts", status: "partial" },
  { id: "open-procurement", principle: "Open, competitive, documented procurement", framework: "GeM · GFR 2017", mechanism: "Procurement register — indents, tenders and award trail", controlRef: "lib/procurement/index.ts", status: "enforced" },
  { id: "fee-transparency", principle: "No hidden fees; every fee head disclosed", framework: "TN fee-regulation · RTE §13", mechanism: "Fee register with disclosed heads and capitation gate", controlRef: "lib/fees/index.ts", status: "enforced" },
  { id: "scholarship-traceability", principle: "Scholarships disbursed transparently and traceably", framework: "NSP · DBT", mechanism: "Scholarship register tracking sanction through disbursement", controlRef: "lib/scholarship/index.ts", status: "partial" },
  { id: "asset-accounting", principle: "Public assets inventoried and accounted", framework: "GFR 2017", mechanism: "Asset register with acquisition, custody and condition tracking", controlRef: "lib/assets/index.ts", status: "enforced" },
  { id: "community-oversight", principle: "Community oversight of school funds", framework: "RTE §21 (SMC)", mechanism: "SMC quorum-voting register approving fund utilisation", controlRef: "lib/smc/index.ts", status: "enforced" },
  { id: "statutory-audit", principle: "CAG-ready, tamper-evident financial trail", framework: "C&AG of India", mechanism: "Hash-chained tamper-evident ledger over financial events", controlRef: "lib/audit/trail.ts", status: "enforced" },
  { id: "rti-disclosure", principle: "Proactive disclosure and the right to information", framework: "RTI Act 2005 §4", mechanism: "RTI request register with proactive-disclosure tracking", controlRef: "lib/rti/index.ts", status: "enforced" },
]

export function controlById(id: string): FinTransparencyControl | undefined {
  return FIN_TRANSPARENCY_CONTROLS.find((c) => c.id === id)
}

export function byStatus(status: FinTransparencyStatus): FinTransparencyControl[] {
  return FIN_TRANSPARENCY_CONTROLS.filter((c) => c.status === status)
}

export interface FinTransparencySummary {
  controls: number
  enforced: number
  partial: number
  /** Distinct frameworks/authorities answered to across the register. */
  frameworksCovered: number
}

export function finTransparencySummary(items: FinTransparencyControl[] = FIN_TRANSPARENCY_CONTROLS): FinTransparencySummary {
  return {
    controls: items.length,
    enforced: items.filter((c) => c.status === "enforced").length,
    partial: items.filter((c) => c.status === "partial").length,
    frameworksCovered: new Set(items.map((c) => c.framework)).size,
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(items: FinTransparencyControl[] = FIN_TRANSPARENCY_CONTROLS): string {
  const header = ["Principle", "Framework", "Mechanism", "Component", "Status"]
  const rows = items.map((c) => [c.principle, c.framework, c.mechanism, c.controlRef, c.status].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
