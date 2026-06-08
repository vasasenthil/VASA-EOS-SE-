// VASA-EOS(SE) — purpose-limited projection of a student record onto a PII data class.
// DPDP data-minimisation: a consent-gated reader returns only the fields belonging to
// the requested data class, never the whole record. Pure + client-safe so the slicing
// rule is unit-testable; the server reader (./student-pii) composes it with the gate.

import type { SisStudent } from "@/lib/sis"
import { piiClassById } from "./pii-catalogue"

export interface StudentPiiView {
  classId: string
  dataClass: string
  apaarId: string
  /** Only the fields belonging to the requested data class (minimised). */
  fields: Record<string, string>
}

/**
 * Project the fields of one PII data class out of a student record. Returns null for an
 * unknown class so the caller fails closed. Each class exposes a minimal, relevant slice.
 */
export function projectStudentPii(student: SisStudent, classId: string): StudentPiiView | null {
  const klass = piiClassById(classId)
  if (!klass) return null

  let fields: Record<string, string>
  switch (classId) {
    case "identity":
      fields = { name: student.name, gender: student.gender ?? "—", category: student.category ?? "—", apaar: student.apaarId }
      break
    case "contact":
      fields = { district: student.district ?? "—", school: student.currentSchoolUdise ?? "—", className: student.className }
      break
    case "scheme":
      fields = { schemes: student.schemes.join("; ") || "—" }
      break
    case "attendance":
      fields = { attendancePct: String(student.attendancePct), nipun: student.nipunStatus }
      break
    case "disability":
      fields = student.cwsn
        ? { category: String(student.cwsn.category), label: student.cwsn.label }
        : { status: "none on record" }
      break
    case "assessment":
      fields = { nipun: student.nipunStatus, riskFlags: student.riskFlags.join("; ") || "—" }
      break
    default:
      // health / aadhaar have no projection on the SIS roster — expose nothing.
      fields = {}
  }

  return { classId, dataClass: klass.dataClass, apaarId: student.apaarId, fields }
}
