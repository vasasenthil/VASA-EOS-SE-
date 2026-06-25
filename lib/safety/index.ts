// VASA-EOS(SE) — safety & anti-ragging committee log (Sec 4C / safeguarding).
// Report safety/anti-ragging/POSH/POCSO concerns and track to resolution. Pure.

export const SAFETY_CATEGORIES = [
  "Anti-ragging",
  "POSH (harassment)",
  "Child protection (POCSO)",
  "Fire safety",
  "Building safety",
  "Road / transport safety",
]

export type SafetyStatus = "reported" | "under_review" | "resolved"

export const SAFETY_FLOW: SafetyStatus[] = ["reported", "under_review", "resolved"]

export function nextSafetyStatus(s: SafetyStatus): SafetyStatus {
  const i = SAFETY_FLOW.indexOf(s)
  return i < 0 || i >= SAFETY_FLOW.length - 1 ? "resolved" : SAFETY_FLOW[i + 1]
}

export interface SafetyConcern {
  id: string
  category: string
  description: string
  action: string
  status: SafetyStatus
  date: string
  /** Tenant node (school/block/…) this concern belongs to — drives data scoping. */
  tenantId: string
}

export interface SafetySummary {
  total: number
  open: number
  resolved: number
  antiRagging: number
}

export function safetySummary(concerns: SafetyConcern[]): SafetySummary {
  return {
    total: concerns.length,
    open: concerns.filter((c) => c.status !== "resolved").length,
    resolved: concerns.filter((c) => c.status === "resolved").length,
    antiRagging: concerns.filter((c) => c.category === "Anti-ragging").length,
  }
}
