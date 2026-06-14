// VASA-EOS(SE) — Child-safety incident form + mandatory-report rule (Health, Safety & Welfare).
//
// Safeguarding incidents are reported, verified, and (for POCSO / serious cases) MANDATORILY
// reported to the CWC / Police within 24 hours, then escalated to the District Child Protection
// Unit. POCSO §23 confidentiality is built in: this form captures NO victim identity — only an
// anonymised case reference, a factual account, category and severity. Pure + client-safe.

export const INCIDENT_CATEGORIES = [
  "POCSO (sexual offence)",
  "Corporal punishment",
  "Bullying / Ragging",
  "Substance abuse",
  "Cyber safety",
  "Accident / injury",
  "Other safeguarding",
] as const

export const INCIDENT_SEVERITY = ["low", "medium", "high", "critical"] as const
export type IncidentSeverity = (typeof INCIDENT_SEVERITY)[number]

/** Categories that always require a mandatory CWC/Police report (POCSO §19). */
const MANDATORY_CATEGORIES = new Set(["POCSO (sexual offence)"])

export interface IncidentForm {
  /** Anonymised case reference — POCSO §23 forbids capturing victim identity. */
  caseRef: string
  category: string
  severity: IncidentSeverity
  incidentDate: string // ISO yyyy-mm-dd
  account: string
  reportedBy: string
  confidentiality: boolean
}

export function emptyIncident(): IncidentForm {
  return { caseRef: "", category: "", severity: "low", incidentDate: "", account: "", reportedBy: "", confidentiality: false }
}

export type FieldErrors = Partial<Record<keyof IncidentForm, string>>

const MIN_ACCOUNT = 20
/** A plausible anonymised case reference (no names): letters/digits/hyphen, no spaces. */
const CASE_REF_RE = /^[A-Za-z0-9-]{4,24}$/

export function validateIncident(f: IncidentForm, asOf: Date = new Date()): { ok: boolean; errors: FieldErrors } {
  const e: FieldErrors = {}
  if (!CASE_REF_RE.test(f.caseRef.trim())) e.caseRef = "Use an anonymised reference (4–24 chars, no spaces/names)"
  else if (/\s/.test(f.caseRef)) e.caseRef = "The reference must not contain spaces"
  if (!(INCIDENT_CATEGORIES as readonly string[]).includes(f.category)) e.category = "Select a category"
  if (!(INCIDENT_SEVERITY as readonly string[]).includes(f.severity)) e.severity = "Select a severity"
  if (!f.incidentDate) e.incidentDate = "Incident date is required"
  else {
    const d = new Date(f.incidentDate)
    if (Number.isNaN(d.getTime())) e.incidentDate = "Enter a valid date"
    else if (d.getTime() > asOf.getTime()) e.incidentDate = "Incident date cannot be in the future"
  }
  if (f.account.trim().length < MIN_ACCOUNT) e.account = `Record a factual account (min ${MIN_ACCOUNT} characters)`
  if (!f.reportedBy.trim()) e.reportedBy = "Reporter is required"
  if (!f.confidentiality) e.confidentiality = "You must acknowledge POCSO §23 confidentiality"
  return { ok: Object.keys(e).length === 0, errors: e }
}

/** True when the incident triggers a mandatory CWC/Police report (POCSO, or critical). */
export function isMandatoryReport(f: IncidentForm): boolean {
  return MANDATORY_CATEGORIES.has(f.category) || f.severity === "critical"
}

/** True when the case must escalate to the District Child Protection Unit. */
export function mustEscalate(f: IncidentForm): boolean {
  return isMandatoryReport(f) || f.severity === "high"
}
