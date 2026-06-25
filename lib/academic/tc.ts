// VASA-EOS(SE) — Transfer Certificate (TC) issuance form + counter-signature rule (Academic
// & Assessment / Records, School tier).
//
// When a student leaves, the school issues a TC against the student's 12-digit APAAR id and its
// own 11-digit UDISE code. A TC can NEVER be issued with pending dues. An ORIGINAL within Tamil
// Nadu is signed by the Headmaster alone; an INTER-STATE original or a DUPLICATE (lost-original)
// additionally needs a Block (BEO) counter-signature. This is the rich form and the pure rules
// that decide the route. Pure + client-safe.

export const TC_TYPES = [
  "Original — within Tamil Nadu",
  "Original — inter-state",
  "Duplicate (lost original)",
] as const
export type TcType = (typeof TC_TYPES)[number]

/** School classes I–XII (Roman numerals, as printed on the TC). */
export const CLASSES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"] as const

const APAAR_RE = /^\d{12}$/
const UDISE_RE = /^\d{11}$/
const MIN_REASON = 10

export interface TcForm {
  studentName: string
  apaarId: string
  udiseCode: string
  lastClass: string
  tcType: TcType
  reason: string
  dateOfLeaving: string
  duesCleared: boolean
  declaration: boolean
}

export function emptyTc(): TcForm {
  return {
    studentName: "",
    apaarId: "",
    udiseCode: "",
    lastClass: "",
    tcType: "Original — within Tamil Nadu",
    reason: "",
    dateOfLeaving: "",
    duesCleared: false,
    declaration: false,
  }
}

export type FieldErrors = Partial<Record<keyof TcForm, string>>

export function validateTc(f: TcForm): { ok: boolean; errors: FieldErrors } {
  const e: FieldErrors = {}
  if (!f.studentName.trim()) e.studentName = "Student name is required"
  if (!APAAR_RE.test(f.apaarId.trim())) e.apaarId = "APAAR id must be 12 digits"
  if (!UDISE_RE.test(f.udiseCode.trim())) e.udiseCode = "UDISE code must be 11 digits"
  if (!(CLASSES as readonly string[]).includes(f.lastClass)) e.lastClass = "Select the class last studied"
  if (!(TC_TYPES as readonly string[]).includes(f.tcType)) e.tcType = "Select the certificate type"
  if (f.reason.trim().length < MIN_REASON) e.reason = `State the reason for leaving (min ${MIN_REASON} characters)`
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.dateOfLeaving.trim())) e.dateOfLeaving = "Use a date like 2026-06-16"
  if (!f.duesCleared) e.duesCleared = "A TC cannot be issued with pending dues"
  if (!f.declaration) e.declaration = "You must certify the particulars are correct"
  return { ok: Object.keys(e).length === 0, errors: e }
}

/** True when the TC needs a Block (BEO) counter-signature: inter-state originals and duplicates. */
export function needsCountersign(f: { tcType: TcType }): boolean {
  return f.tcType !== "Original — within Tamil Nadu"
}
