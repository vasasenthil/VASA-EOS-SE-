// VASA-EOS(SE) — Governance forum resolution form model + validation (state-tier executive governance).
//
// A governance-forum item is a formal act of the State executive, not a free-text note: a forum, a category, a
// scheduled meeting date, a substantive resolution text, explicit RACI ownership (a Responsible driver and an
// Accountable owner), an optional fund implication, and named action items. Significant items — flagged, or with a
// fund implication at/above the ratification threshold — escalate to Minister ratification automatically. This is
// the rich form with per-field validation enforcing those rules, plus a completeness score. Pure + client-safe;
// the server action files it into the FORUM_RESOLUTION workflow (Secretary convenes & adopts → quorum of 2
// Directors adopts → Minister ratifies significant items).

/** Items at/above this fund implication (₹10 crore) require Minister ratification. */
export const MINISTER_RATIFICATION_THRESHOLD = 100_000_000

export const GOVERNANCE_FORUMS = [
  "State Steering Committee",
  "Programme Management",
  "Budget & Finance Committee",
  "Academic Standards Council",
  "Procurement Board",
  "Audit & Compliance Committee",
] as const

export const FORUM_CATEGORIES = [
  "Budget & finance",
  "Policy directive",
  "Programme review",
  "HR & cadre",
  "Procurement",
  "Audit & compliance",
  "Other",
] as const

export interface ForumResolutionForm {
  forum: string
  category: string
  title: string
  meetingDate: string // ISO yyyy-mm-dd
  decisionText: string
  /** RACI — the Responsible driver who executes. */
  responsible: string
  /** RACI — the single Accountable owner who answers for the outcome. */
  accountable: string
  /** Optional fund implication in ₹ (0 = none). At/above the threshold → Minister. */
  fundImplication: number
  /** Force Minister ratification regardless of fund value (e.g. policy significance). */
  significant: boolean
  /** Named follow-up actions captured with the meeting. */
  actionItems: string[]
  declaration: boolean
}

export function emptyForumResolution(): ForumResolutionForm {
  return {
    forum: "",
    category: "",
    title: "",
    meetingDate: "",
    decisionText: "",
    responsible: "",
    accountable: "",
    fundImplication: 0,
    significant: false,
    actionItems: [],
    declaration: false,
  }
}

export type FieldErrors = Partial<Record<keyof ForumResolutionForm, string>>

const MIN_DECISION = 30

/** Whether this item must go to the Minister for ratification. */
export function requiresMinister(f: ForumResolutionForm): boolean {
  return f.significant || (Number.isFinite(f.fundImplication) && f.fundImplication >= MINISTER_RATIFICATION_THRESHOLD)
}

export function validateForumResolution(f: ForumResolutionForm): { ok: boolean; errors: FieldErrors } {
  const e: FieldErrors = {}
  if (!(GOVERNANCE_FORUMS as readonly string[]).includes(f.forum)) e.forum = "Select a governance forum"
  if (!(FORUM_CATEGORIES as readonly string[]).includes(f.category)) e.category = "Select a category"
  if (!f.title.trim()) e.title = "A resolution / agenda title is required"

  if (!f.meetingDate) e.meetingDate = "Meeting date is required"
  else if (Number.isNaN(new Date(f.meetingDate).getTime())) e.meetingDate = "Enter a valid date"

  if (f.decisionText.trim().length < MIN_DECISION) e.decisionText = `The resolution text must be at least ${MIN_DECISION} characters`
  if (!f.responsible.trim()) e.responsible = "Name the Responsible driver (RACI)"
  if (!f.accountable.trim()) e.accountable = "Name the single Accountable owner (RACI)"
  if (f.fundImplication < 0) e.fundImplication = "Fund implication cannot be negative"
  if (!f.declaration) e.declaration = "You must confirm the item is duly tabled"

  return { ok: Object.keys(e).length === 0, errors: e }
}

const REQUIRED: (keyof ForumResolutionForm)[] = ["forum", "category", "title", "meetingDate", "responsible", "accountable"]

export function completenessPct(f: ForumResolutionForm): number {
  let filled = 0
  const total = REQUIRED.length + 2 // + decisionText + declaration
  for (const k of REQUIRED) if (String(f[k]).trim()) filled++
  if (f.decisionText.trim().length >= MIN_DECISION) filled++
  if (f.declaration) filled++
  return Math.round((filled / total) * 100)
}
