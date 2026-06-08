"use server"

import { unstable_noStore as noStore } from "next/cache"
import { getSisStudent, type SisStudent } from "@/lib/sis"
import { gatePii } from "@/lib/consent/gate-server"
import { logger } from "@/lib/logger"

/**
 * Consent-gated PII read (reference enforcement). A student's full SIS record is
 * released only when scheme-eligibility consent is on file for that APAAR id;
 * otherwise null. The decision is audited by the consent gate.
 */
export async function getStudentForSchemeAction(apaarId: string): Promise<SisStudent | null> {
  noStore()
  try {
    return await gatePii(apaarId, "scheme_eligibility", () => getSisStudent(apaarId) ?? null)
  } catch (e) {
    logger.error("sis.pii-read failed", { error: String(e) })
    return null
  }
}
