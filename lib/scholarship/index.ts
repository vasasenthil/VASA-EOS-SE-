// VASA-EOS(SE) — scholarship & welfare disbursement tracking (Sec 44 / DBT).
// Per-beneficiary scheme status along the application → disbursement pipeline.

export type ScholarStatus = "eligible" | "applied" | "sanctioned" | "disbursed"

export const SCHOLAR_FLOW: ScholarStatus[] = ["eligible", "applied", "sanctioned", "disbursed"]

export function nextStatus(s: ScholarStatus): ScholarStatus {
  const i = SCHOLAR_FLOW.indexOf(s)
  return i < 0 || i >= SCHOLAR_FLOW.length - 1 ? "disbursed" : SCHOLAR_FLOW[i + 1]
}

export interface ScholarRow {
  id: string
  name: string
  scheme: string
  amount: number // rupees
  status: ScholarStatus
  /** Tenant node this beneficiary belongs to — drives per-role data scoping. */
  tenantId: string
}

export const SCHOLARSHIP_LEDGER: ScholarRow[] = [
  { id: "S1", name: "Aarthi M", scheme: "Pudhumai Penn", amount: 12000, status: "disbursed", tenantId: "TN-CHN-B1-S1" },
  { id: "S2", name: "Bharath K", scheme: "Adi Dravidar Welfare", amount: 8000, status: "sanctioned", tenantId: "TN-CHN-B2-S1" },
  { id: "S3", name: "Charumathi R", scheme: "Pudhumai Penn", amount: 12000, status: "applied", tenantId: "TN-CBE-B1-S1" },
  { id: "S4", name: "Dinesh S", scheme: "Naan Mudhalvan Stipend", amount: 6000, status: "eligible", tenantId: "TN-CHN-B1-S1" },
  { id: "S5", name: "Eswari T", scheme: "Tribal Welfare Hostel", amount: 15000, status: "sanctioned", tenantId: "TN-CHN-B2-S1" },
  { id: "S6", name: "Faizal A", scheme: "Minority Welfare", amount: 9000, status: "applied", tenantId: "TN-CBE-B1-S1" },
]

export interface ScholarSummary {
  beneficiaries: number
  sanctioned: number
  disbursed: number
  amountDisbursed: number
}

export function scholarshipSummary(rows: ScholarRow[] = SCHOLARSHIP_LEDGER): ScholarSummary {
  return {
    beneficiaries: rows.length,
    sanctioned: rows.filter((r) => r.status === "sanctioned").length,
    disbursed: rows.filter((r) => r.status === "disbursed").length,
    amountDisbursed: rows.filter((r) => r.status === "disbursed").reduce((s, r) => s + r.amount, 0),
  }
}

export function inr(rupees: number): string {
  return `₹${rupees.toLocaleString("en-IN")}`
}
