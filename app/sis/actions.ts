"use server"

import { unstable_noStore as noStore } from "next/cache"
import { getSisStudent, type SisStudent } from "@/lib/sis"
import { gatePiiClass } from "@/lib/consent/gate-server"
import { readStudentPii } from "@/lib/consent/student-pii"
import type { StudentPiiView } from "@/lib/consent/student-pii-view"
import { logger } from "@/lib/logger"

/**
 * Consent-gated PII read (reference enforcement). A student's full SIS record is
 * released only when scheme-eligibility consent (the gating purpose of the "scheme"
 * PII class) is on file for that APAAR id; otherwise null. Audited by the consent gate.
 */
export async function getStudentForSchemeAction(apaarId: string): Promise<SisStudent | null> {
  noStore()
  try {
    return await gatePiiClass(apaarId, "scheme", () => getSisStudent(apaarId) ?? null)
  } catch (e) {
    logger.error("sis.pii-read failed", { error: String(e) })
    return null
  }
}

/**
 * Catalogue-driven, consent-gated read of one PII data class for a student (identity,
 * contact, scheme, attendance, disability, assessment …). The class is resolved to its
 * gating consent purpose; only the minimised projection is returned. Fail-closed.
 */
export async function getStudentPiiAction(apaarId: string, classId: string): Promise<StudentPiiView | null> {
  noStore()
  try {
    return await readStudentPii(apaarId, classId)
  } catch (e) {
    logger.error("sis.pii-class-read failed", { classId, error: String(e) })
    return null
  }
}
