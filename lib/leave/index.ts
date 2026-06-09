// VASA-EOS(SE) — teacher leave management (Sec 16 / HR ops).
// Leave requests with an approval workflow; approved leave is the trigger for
// substitution planning. Pure day-count + decision + summary helpers.

export type LeaveType = "casual" | "medical" | "earned" | "maternity"
export type LeaveStatus = "pending" | "approved" | "rejected"

export const LEAVE_TYPES: { key: LeaveType; label: string }[] = [
  { key: "casual", label: "Casual leave" },
  { key: "medical", label: "Medical leave" },
  { key: "earned", label: "Earned leave" },
  { key: "maternity", label: "Maternity leave" },
]

export interface LeaveRequest {
  id: string
  teacher: string
  type: LeaveType
  from: string // YYYY-MM-DD
  to: string
  reason: string
  status: LeaveStatus
}

/** Inclusive day count between two dates (min 1; 0 if invalid/reversed). */
export function leaveDays(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`).getTime()
  const b = new Date(`${to}T00:00:00Z`).getTime()
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 0
  return Math.floor((b - a) / 86400000) + 1
}

export interface LeaveSummary {
  pending: number
  approved: number
  rejected: number
  daysApproved: number
}

export function leaveSummary(reqs: LeaveRequest[]): LeaveSummary {
  return {
    pending: reqs.filter((r) => r.status === "pending").length,
    approved: reqs.filter((r) => r.status === "approved").length,
    rejected: reqs.filter((r) => r.status === "rejected").length,
    daysApproved: reqs.filter((r) => r.status === "approved").reduce((s, r) => s + leaveDays(r.from, r.to), 0),
  }
}
