// VASA-EOS(SE) — visitor / gate management (Sec 4C / safety · POCSO).
// Log entry, check-out, and who is currently on the premises. Pure summary helpers.

export const VISIT_PURPOSES = ["Parent meeting", "Official visit", "Vendor / delivery", "Inspection", "Other"]

export interface Visitor {
  id: string
  name: string
  purpose: string
  meeting: string // person/dept being visited
  inTime: string
  outTime?: string
}

export function isOnPremises(v: Visitor): boolean {
  return !v.outTime
}

export interface VisitorSummary {
  total: number
  onPremises: number
  checkedOut: number
}

export function visitorSummary(visitors: Visitor[]): VisitorSummary {
  const onPremises = visitors.filter(isOnPremises).length
  return { total: visitors.length, onPremises, checkedOut: visitors.length - onPremises }
}
