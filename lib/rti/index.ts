// VASA-EOS(SE) — RTI request register (RTI Act 2005, 30-day statutory limit).
// Log applications and track replies against the deadline. Pure logic.

export const RTI_LIMIT_DAYS = 30

export type RtiStatus = "received" | "under_process" | "replied"

export const RTI_FLOW: RtiStatus[] = ["received", "under_process", "replied"]

export function nextRtiStatus(s: RtiStatus): RtiStatus {
  const i = RTI_FLOW.indexOf(s)
  return i < 0 || i >= RTI_FLOW.length - 1 ? "replied" : RTI_FLOW[i + 1]
}

export interface RtiRequest {
  id: string
  applicant: string
  subject: string
  receivedDate: string
  status: RtiStatus
}

export function daysUsed(receivedDate: string, today: string): number {
  return Math.floor((Date.parse(today) - Date.parse(receivedDate)) / 86_400_000)
}

export function daysLeft(receivedDate: string, today: string): number {
  return RTI_LIMIT_DAYS - daysUsed(receivedDate, today)
}

export function isOverdue(req: RtiRequest, today: string): boolean {
  return req.status !== "replied" && daysLeft(req.receivedDate, today) < 0
}

export interface RtiSummary {
  total: number
  replied: number
  pending: number
  overdue: number
}

export function rtiSummary(requests: RtiRequest[], today: string): RtiSummary {
  return {
    total: requests.length,
    replied: requests.filter((r) => r.status === "replied").length,
    pending: requests.filter((r) => r.status !== "replied").length,
    overdue: requests.filter((r) => isOverdue(r, today)).length,
  }
}
