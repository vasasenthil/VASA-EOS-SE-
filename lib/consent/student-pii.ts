import "server-only"

// VASA-EOS(SE) — consent-gated student PII reader (Security depth).
// A single catalogue-driven seam every UI/action uses to read a slice of a student's
// PII: the data class is resolved to its gating consent purpose, consent is enforced
// fail-closed, the decision is audited, and only the minimised projection is returned.

import { getSisStudent } from "@/lib/sis"
import { gatePiiClass } from "./gate-server"
import { projectStudentPii, type StudentPiiView } from "./student-pii-view"

/**
 * Read one PII data class for a student, gated by the consent purpose the PII catalogue
 * assigns to that class. Returns null when consent is absent, the class is unclassified,
 * or no student matches — the caller never sees ungated PII.
 */
export async function readStudentPii(apaarId: string, classId: string): Promise<StudentPiiView | null> {
  return gatePiiClass(apaarId, classId, () => {
    const student = getSisStudent(apaarId)
    return student ? projectStudentPii(student, classId) : null
  })
}
