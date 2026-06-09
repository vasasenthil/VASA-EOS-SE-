// VASA-EOS(SE) — master-data identifier & code-system standards (Data / interoperability).
//
// Interoperability and MDM ("single source of truth") need the canonical identifier
// formats the platform speaks: APAAR/PEN, UDISE+, Aadhaar (verify-only), ABHA, TN
// Teacher ID, IFSC (for DBT), mobile, and the class/grade code. Each standard declares
// its issuing authority, an anchored validation pattern, an example and what it keys.
// The register is self-verifying: a test asserts every example validates against its
// own pattern, and validate() enforces the format at the boundary. Pure + client-safe.

export interface IdStandard {
  id: string
  name: string
  authority: string
  /** Anchored regular-expression source the value must match. */
  pattern: string
  example: string
  usedFor: string
}

export const ID_STANDARDS: IdStandard[] = [
  { id: "apaar", name: "APAAR / PEN", authority: "MoE / NCERT (NEP 2020)", pattern: "^\\d{12}$", example: "100200300401", usedFor: "Lifelong learner identity (single source of truth)" },
  { id: "udise", name: "UDISE+ code", authority: "MoE (UDISE+)", pattern: "^\\d{11}$", example: "33010100101", usedFor: "School & enrolment registry of record" },
  { id: "aadhaar", name: "Aadhaar (verify-only)", authority: "UIDAI", pattern: "^\\d{12}$", example: "234567890123", usedFor: "Identity verification — never stored" },
  { id: "abha", name: "ABHA number", authority: "NHA (ABDM)", pattern: "^\\d{14}$", example: "12345678901234", usedFor: "Health record linkage (RBSK federation)" },
  { id: "teacher-id", name: "TN Teacher ID", authority: "School Education Dept, TN", pattern: "^TN\\d{8}$", example: "TN12345678", usedFor: "Teacher identity & transfers" },
  { id: "ifsc", name: "Bank IFSC", authority: "RBI", pattern: "^[A-Z]{4}0[A-Z0-9]{6}$", example: "SBIN0001234", usedFor: "DBT scheme disbursement routing" },
  { id: "mobile", name: "Mobile number", authority: "TRAI / DoT", pattern: "^[6-9]\\d{9}$", example: "9876543210", usedFor: "Guardian contact, IVR, OTP" },
  { id: "class-code", name: "Class / grade code", authority: "SCERT / NCERT", pattern: "^(0[1-9]|1[0-2])$", example: "09", usedFor: "Grade-level coding (Class 1–12)" },
]

export function standardById(id: string): IdStandard | undefined {
  return ID_STANDARDS.find((s) => s.id === id)
}

/** Validate a value against a named identifier standard. Unknown standard => false. */
export function validate(standardId: string, value: string): boolean {
  const std = standardById(standardId)
  if (!std) return false
  return new RegExp(std.pattern).test(value)
}

/** Standards whose own example does NOT match their pattern (should be none). */
export function invalidExamples(): string[] {
  return ID_STANDARDS.filter((s) => !new RegExp(s.pattern).test(s.example)).map((s) => s.id)
}

export interface StandardsSummary {
  standards: number
  authorities: number
}

export function standardsSummary(items: IdStandard[] = ID_STANDARDS): StandardsSummary {
  return {
    standards: items.length,
    authorities: new Set(items.map((s) => s.authority)).size,
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(items: IdStandard[] = ID_STANDARDS): string {
  const header = ["Standard", "Authority", "Pattern", "Example", "Used for"]
  const rows = items.map((s) => [s.name, s.authority, s.pattern, s.example, s.usedFor].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
