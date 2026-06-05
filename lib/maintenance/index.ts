// VASA-EOS(SE) — infrastructure maintenance tickets (Sec 50 / works pipeline).
// Raise → in progress → resolved, with priority. Pure status/summary helpers.

export type Priority = "low" | "medium" | "high"
export type TicketStatus = "open" | "in_progress" | "resolved"

export const TICKET_FLOW: TicketStatus[] = ["open", "in_progress", "resolved"]

export const MAINT_CATEGORIES = ["Electrical", "Plumbing", "Furniture", "Building", "IT / Smart class", "Sanitation"]

export interface Ticket {
  id: string
  category: string
  description: string
  priority: Priority
  status: TicketStatus
  raisedOn: string
}

export function nextTicketStatus(s: TicketStatus): TicketStatus {
  const i = TICKET_FLOW.indexOf(s)
  return i < 0 || i >= TICKET_FLOW.length - 1 ? "resolved" : TICKET_FLOW[i + 1]
}

export interface MaintSummary {
  total: number
  open: number
  inProgress: number
  resolved: number
  highOpen: number
}

export function maintenanceSummary(tickets: Ticket[]): MaintSummary {
  return {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    highOpen: tickets.filter((t) => t.priority === "high" && t.status !== "resolved").length,
  }
}
