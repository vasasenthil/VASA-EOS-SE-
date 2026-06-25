// VASA-EOS(SE) — RTI request form + fee/expedite rules (Identity & Data / civic transparency).
//
// Under the RTI Act 2005 a citizen seeks information from a public authority; a ₹10 application
// fee applies unless the applicant is Below Poverty Line (exempt, §7(5)), and requests
// concerning the life or liberty of a person are expedited (48 hours, §7(1)). This is the rich
// form and the pure rules that decide the fee and the response deadline. Pure + client-safe.

export const RTI_CATEGORIES = [
  "Admissions / RTE",
  "Schemes / DBT",
  "Examinations / results",
  "Recruitment / transfers",
  "Finance / budget",
  "Infrastructure / works",
  "Other",
] as const

/** Standard RTI application fee (₹), waived for BPL applicants. */
export const RTI_FEE = 10
/** Normal response deadline (days, §7(1)). */
export const RTI_DEADLINE_DAYS = 30
/** Expedited deadline (hours) where life or liberty is concerned. */
export const RTI_EXPEDITE_HOURS = 48

export interface RtiForm {
  applicant: string
  category: string
  subject: string
  informationSought: string
  bpl: boolean
  lifeAndLiberty: boolean
  declaration: boolean
}

export function emptyRti(): RtiForm {
  return { applicant: "", category: "", subject: "", informationSought: "", bpl: false, lifeAndLiberty: false, declaration: false }
}

export type FieldErrors = Partial<Record<keyof RtiForm, string>>

const MIN_INFO = 15

export function validateRti(f: RtiForm): { ok: boolean; errors: FieldErrors } {
  const e: FieldErrors = {}
  if (!f.applicant.trim()) e.applicant = "Applicant name is required"
  if (!(RTI_CATEGORIES as readonly string[]).includes(f.category)) e.category = "Select a category"
  if (!f.subject.trim()) e.subject = "A subject is required"
  if (f.informationSought.trim().length < MIN_INFO) e.informationSought = `Describe the information sought (min ${MIN_INFO} characters)`
  if (!f.declaration) e.declaration = "You must confirm you are an Indian citizen"
  return { ok: Object.keys(e).length === 0, errors: e }
}

/** The application fee payable (₹0 when BPL-exempt). */
export function applicationFee(f: RtiForm): number {
  return f.bpl ? 0 : RTI_FEE
}

export interface RtiTiming {
  expedited: boolean
  /** Human-readable response deadline. */
  deadline: string
}

export function responseTiming(f: RtiForm): RtiTiming {
  return f.lifeAndLiberty
    ? { expedited: true, deadline: `${RTI_EXPEDITE_HOURS} hours (life & liberty)` }
    : { expedited: false, deadline: `${RTI_DEADLINE_DAYS} days` }
}
