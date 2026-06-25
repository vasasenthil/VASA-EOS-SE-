// VASA-EOS(SE) — Early-Warning case (the human-in-the-loop record).
//
// When a human acts on an AI risk flag they open a case; the case moves Open → Acknowledged →
// Resolved with an assignee and intervention notes. The AI never opens or closes a case — it only
// advises. Pure model + validation + query.

export const CASE_STATUSES = ["Open", "Acknowledged", "Resolved"] as const
export type CaseStatus = (typeof CASE_STATUSES)[number]

export interface EwsCase {
  id: string
  student: string
  apaarId: string
  classLevel: string
  section: string
  riskLevel: string
  score: number
  factors: string
  status: CaseStatus
  assignee: string
  intervention: string
  openedBy: string
  createdAt: string
  updatedAt: string
}

export interface CaseInput {
  student: string
  apaarId: string
  classLevel: string
  section: string
  riskLevel: string
  score: number
  factors: string
  status: CaseStatus
  assignee: string
  intervention: string
  openedBy: string
}

export type CaseErrors = Partial<Record<keyof CaseInput, string>>

export function validateCase(f: CaseInput): { ok: boolean; errors: CaseErrors } {
  const e: CaseErrors = {}
  if (!f.student.trim()) e.student = "Student is required"
  if (!(CASE_STATUSES as readonly string[]).includes(f.status)) e.status = "Select a status"
  if (f.status !== "Open" && !f.assignee.trim()) e.assignee = "Assign the case before acknowledging"
  if (f.status === "Resolved" && !f.intervention.trim()) e.intervention = "Record the intervention before resolving"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface CaseSummary {
  total: number
  open: number
  acknowledged: number
  resolved: number
}

export function caseSummary(cases: EwsCase[]): CaseSummary {
  return {
    total: cases.length,
    open: cases.filter((c) => c.status === "Open").length,
    acknowledged: cases.filter((c) => c.status === "Acknowledged").length,
    resolved: cases.filter((c) => c.status === "Resolved").length,
  }
}

export function queryCases(all: EwsCase[], status?: string): EwsCase[] {
  const order: Record<CaseStatus, number> = { Open: 0, Acknowledged: 1, Resolved: 2 }
  return all
    .filter((c) => !status || c.status === status)
    .sort((a, b) => order[a.status] - order[b.status] || b.score - a.score)
}
