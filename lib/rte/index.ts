// VASA-EOS(SE) — RTE 25% quota tracker (RTE Act 2009, Sec 12(1)(c)).
// Track EWS/DG applicants for reserved seats through to admission + reimbursement. Pure logic.

export type RteStatus = "applied" | "verified" | "allotted" | "admitted"

export const RTE_FLOW: RteStatus[] = ["applied", "verified", "allotted", "admitted"]

export function nextRteStatus(s: RteStatus): RteStatus {
  const i = RTE_FLOW.indexOf(s)
  return i < 0 || i >= RTE_FLOW.length - 1 ? "admitted" : RTE_FLOW[i + 1]
}

export const RTE_CATEGORIES = [
  "EWS (economically weaker)",
  "SC",
  "ST",
  "OBC (disadvantaged)",
  "Orphan / HIV-affected",
  "CWSN",
]

export interface RteApplicant {
  id: string
  name: string
  category: string
  status: RteStatus
  date: string
  /** Tenant node this applicant belongs to — drives per-role data scoping. */
  tenantId: string
}

export interface RteSummary {
  quotaSeats: number
  applied: number
  verified: number
  admitted: number
  vacant: number
  fillPct: number
}

export function rteSummary(applicants: RteApplicant[], quotaSeats: number): RteSummary {
  const admitted = applicants.filter((a) => a.status === "admitted").length
  const seats = quotaSeats > 0 ? quotaSeats : 0
  return {
    quotaSeats: seats,
    applied: applicants.length,
    verified: applicants.filter((a) => a.status === "verified" || a.status === "allotted" || a.status === "admitted").length,
    admitted,
    vacant: Math.max(0, seats - admitted),
    fillPct: seats === 0 ? 0 : Math.round((admitted / seats) * 100),
  }
}
