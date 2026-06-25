// VASA-EOS(SE) — School Development Plan (SDP) & SMC budget (Part XIV / Sec 44).
// Plan priorities against the school grant; track allocation, balance, utilisation.

export const SDP_HEADS = [
  "Infrastructure",
  "Learning materials",
  "Teacher training",
  "Sports & co-curricular",
  "Safety & WASH",
  "ICT & digital",
]

export const TOTAL_GRANT = 500000 // rupees (illustrative composite school grant)

export interface SdpPriority {
  id: string
  title: string
  head: string
  amount: number
}

export interface SdpSummary {
  items: number
  allocated: number
  grant: number
  balance: number
  utilisationPct: number
  overBudget: boolean
}

export function sdpSummary(priorities: SdpPriority[], grant: number = TOTAL_GRANT): SdpSummary {
  const allocated = priorities.reduce((s, p) => s + p.amount, 0)
  return {
    items: priorities.length,
    allocated,
    grant,
    balance: grant - allocated,
    utilisationPct: grant === 0 ? 0 : Math.round((allocated / grant) * 100),
    overBudget: allocated > grant,
  }
}

export function inr(rupees: number): string {
  return `₹${rupees.toLocaleString("en-IN")}`
}
