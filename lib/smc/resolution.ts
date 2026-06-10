// VASA-EOS(SE) — SMC resolution form model + validation (RTE §21 School Management Committee).
//
// An SMC resolution is a governance act with meeting rules, not a free text box: it needs a category, a meeting
// date, a substantive resolution text, a PROPOSER and a SECONDER who must be different members, and a quorum of
// members present. This is the rich form with per-field validation enforcing those rules, plus a completeness
// score. Pure + client-safe; the server action files it into the quorum workflow (3 SMC members approve, then
// the Principal counter-signs).

export const SMC_QUORUM = 3
export const RESOLUTION_CATEGORIES = [
  "Budget utilisation",
  "Infrastructure works",
  "School Development Plan",
  "Mid-day meal",
  "Admission policy",
  "Other",
] as const

export interface SmcResolutionForm {
  title: string
  category: string
  meetingDate: string // ISO yyyy-mm-dd
  description: string
  proposedBy: string
  secondedBy: string
  /** Number of SMC members present (must meet the quorum). */
  membersPresent: number
  /** Optional fund implication in ₹ (0 = none). */
  fundImplication: number
  declaration: boolean
}

export function emptyResolution(): SmcResolutionForm {
  return { title: "", category: "", meetingDate: "", description: "", proposedBy: "", secondedBy: "", membersPresent: 0, fundImplication: 0, declaration: false }
}

export type FieldErrors = Partial<Record<keyof SmcResolutionForm, string>>

const MIN_DESCRIPTION = 30

export function validateResolution(f: SmcResolutionForm, asOf: Date = new Date()): { ok: boolean; errors: FieldErrors } {
  const e: FieldErrors = {}
  if (!f.title.trim()) e.title = "A resolution title is required"
  if (!(RESOLUTION_CATEGORIES as readonly string[]).includes(f.category)) e.category = "Select a category"

  if (!f.meetingDate) e.meetingDate = "Meeting date is required"
  else {
    const d = new Date(f.meetingDate)
    if (Number.isNaN(d.getTime())) e.meetingDate = "Enter a valid date"
    else if (d.getTime() > asOf.getTime()) e.meetingDate = "Meeting date cannot be in the future"
  }

  if (f.description.trim().length < MIN_DESCRIPTION) e.description = `The resolution text must be at least ${MIN_DESCRIPTION} characters`
  if (!f.proposedBy.trim()) e.proposedBy = "Proposer is required"
  if (!f.secondedBy.trim()) e.secondedBy = "Seconder is required"
  else if (f.secondedBy.trim().toLowerCase() === f.proposedBy.trim().toLowerCase()) e.secondedBy = "The seconder must be a different member from the proposer"

  if (!Number.isFinite(f.membersPresent) || f.membersPresent < SMC_QUORUM) e.membersPresent = `A quorum of at least ${SMC_QUORUM} members must be present`
  if (f.fundImplication < 0) e.fundImplication = "Fund implication cannot be negative"
  if (!f.declaration) e.declaration = "You must confirm the resolution was duly passed"

  return { ok: Object.keys(e).length === 0, errors: e }
}

export function quorumMet(f: SmcResolutionForm): boolean {
  return Number.isFinite(f.membersPresent) && f.membersPresent >= SMC_QUORUM
}

const REQUIRED: (keyof SmcResolutionForm)[] = ["title", "category", "meetingDate", "proposedBy", "secondedBy"]

export function completenessPct(f: SmcResolutionForm): number {
  let filled = 0
  const total = REQUIRED.length + 3 // + description + quorum + declaration
  for (const k of REQUIRED) if (String(f[k]).trim()) filled++
  if (f.description.trim().length >= MIN_DESCRIPTION) filled++
  if (quorumMet(f)) filled++
  if (f.declaration) filled++
  return Math.round((filled / total) * 100)
}
