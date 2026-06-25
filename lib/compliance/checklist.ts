// VASA-EOS(SE) — school statutory-compliance checklist (pure logic).
//
// Backs the Principal dashboard's "Compliance Checklist" with live, durable items instead of a
// hardcoded array. Each item is a statutory obligation (SMC meeting, UDISE+ submission, mid-day
// meal register, fire-safety drill, health screening, teacher CPD…) with a status. From the set
// we derive a compliance percentage and an overdue count so the headline is honest and auditable.
// Pure + client-safe so the same maths runs in tests and on the dashboard.

export const COMPLIANCE_STATUSES = ["Done", "In Progress", "Pending", "Overdue"] as const
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number]

export interface ComplianceItem {
  item: string
  status: ComplianceStatus
}

export interface ComplianceSummary {
  total: number
  done: number
  overdue: number
  pct: number
}

export function summarise(items: ComplianceItem[]): ComplianceSummary {
  const total = items.length
  const done = items.filter((i) => i.status === "Done").length
  const overdue = items.filter((i) => i.status === "Overdue").length
  return { total, done, overdue, pct: total === 0 ? 0 : Math.round((done / total) * 100) }
}
