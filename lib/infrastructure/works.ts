// VASA-EOS(SE) — Infrastructure works proposal form + routing (Infrastructure & Records).
//
// Capital civil works under Samagra Shiksha / PM SHRI: a school proposes a work with an
// estimate; high-value works (≥ ₹10 lakh) need Directorate approval; RTE/RPwD-mandated works
// (toilets, ramps, drinking water, classrooms) are flagged priority. Pure form + routing rules.

export const WORK_TYPES = [
  "New classroom",
  "Toilet block (gender-segregated)",
  "Ramp / accessibility (RPwD)",
  "Drinking water",
  "Compound wall",
  "Science / computer lab",
  "Electrification",
  "Major repair",
] as const

export const FUNDING_SOURCES = ["Samagra Shiksha", "PM SHRI", "State", "CSR", "MP/MLA LAD"] as const

/** Works at/above this estimate need Directorate (state) approval. */
export const HIGH_VALUE_THRESHOLD = 1000000
/** Work types mandated by RTE / RPwD norms — flagged priority. */
const MANDATED = new Set([
  "Toilet block (gender-segregated)",
  "Ramp / accessibility (RPwD)",
  "Drinking water",
  "New classroom",
])

export interface WorksForm {
  school: string
  workType: string
  estimatedCost: number
  fundingSource: string
  justification: string
  declaration: boolean
}

export function emptyWorks(): WorksForm {
  return { school: "", workType: "", estimatedCost: 0, fundingSource: "", justification: "", declaration: false }
}

export type FieldErrors = Partial<Record<keyof WorksForm, string>>

const MIN_JUSTIFICATION = 20

export function validateWorks(f: WorksForm): { ok: boolean; errors: FieldErrors } {
  const e: FieldErrors = {}
  if (!f.school.trim()) e.school = "School is required"
  if (!(WORK_TYPES as readonly string[]).includes(f.workType)) e.workType = "Select a work type"
  if (!Number.isFinite(f.estimatedCost) || f.estimatedCost <= 0) e.estimatedCost = "Enter the estimated cost"
  if (!(FUNDING_SOURCES as readonly string[]).includes(f.fundingSource)) e.fundingSource = "Select a funding source"
  if (f.justification.trim().length < MIN_JUSTIFICATION) e.justification = `Provide a justification (min ${MIN_JUSTIFICATION} characters)`
  if (!f.declaration) e.declaration = "You must certify the proposal and estimate"
  return { ok: Object.keys(e).length === 0, errors: e }
}

/** True when the work needs Directorate (state) approval. */
export function isHighValue(f: WorksForm): boolean {
  return Number.isFinite(f.estimatedCost) && f.estimatedCost >= HIGH_VALUE_THRESHOLD
}

/** True when the work answers an RTE/RPwD infrastructure norm (priority). */
export function isMandated(f: WorksForm): boolean {
  return MANDATED.has(f.workType)
}
