// VASA-EOS(SE) — homework / assignment tracking (Sec 16 / classroom ops).
// Assign → submitted → graded, with overdue detection. Pure status/summary helpers.

export type HomeworkStatus = "assigned" | "submitted" | "graded"

export const HW_FLOW: HomeworkStatus[] = ["assigned", "submitted", "graded"]

export interface Homework {
  id: string
  subject: string
  title: string
  dueDate: string
  status: HomeworkStatus
  /** Tenant node this homework belongs to — drives per-role data scoping. */
  tenantId: string
}

export function newHwId(): string {
  return `HW-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export function nextHwStatus(s: HomeworkStatus): HomeworkStatus {
  const i = HW_FLOW.indexOf(s)
  return i < 0 || i >= HW_FLOW.length - 1 ? "graded" : HW_FLOW[i + 1]
}

export function isHwOverdue(hw: Homework, today: string): boolean {
  return hw.status === "assigned" && hw.dueDate < today
}

export interface HwSummary {
  total: number
  assigned: number
  submitted: number
  graded: number
  overdue: number
}

export function homeworkSummary(items: Homework[], today: string): HwSummary {
  return {
    total: items.length,
    assigned: items.filter((h) => h.status === "assigned").length,
    submitted: items.filter((h) => h.status === "submitted").length,
    graded: items.filter((h) => h.status === "graded").length,
    overdue: items.filter((h) => isHwOverdue(h, today)).length,
  }
}
