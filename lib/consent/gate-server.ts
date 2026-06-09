import "server-only"

// VASA-EOS(SE) — DPDP consent-gating seam for PII reads (Security pillar).
// A server getter that returns student PII calls gatePii(): the data is released
// only when the subject (or their guardian) has granted consent for that purpose.
// Fail-closed — absent/unreachable consent yields null. Every decision is audited.

import { hasConsent } from "./store"
import { consentGranted, type ConsentPurpose, type ConsentRecord } from "./index"
import { gatingPurpose } from "./pii-catalogue"
import { appendAudit } from "@/lib/audit/trail"
import { logger } from "@/lib/logger"

export { consentGranted }
export type { ConsentRecord }

/** Whether the subject has effective consent for a purpose (fail-closed on error). */
export async function requireConsent(subjectApaar: string, purpose: ConsentPurpose): Promise<boolean> {
  try {
    return await hasConsent(subjectApaar, purpose)
  } catch (e) {
    logger.error("consent check errored; denying", { subjectApaar, purpose, error: String(e) })
    return false
  }
}

/**
 * Release PII only with consent. Returns the getter's value when consent is granted,
 * otherwise null — and records a tamper-evident audit entry for the decision.
 */
export async function gatePii<T>(
  subjectApaar: string,
  purpose: ConsentPurpose,
  getter: () => T | Promise<T>,
): Promise<T | null> {
  const granted = await requireConsent(subjectApaar, purpose)
  await appendAudit({
    actor: "consent-gate",
    action: granted ? "pii.read.allowed" : "pii.read.denied",
    resource: subjectApaar,
    details: { purpose },
  })
  if (!granted) return null
  return await getter()
}

/**
 * Catalogue-driven PII gate. Resolves the gating consent purpose for a PII data class
 * from the PII catalogue (lib/consent/pii-catalogue) and enforces it. Fail-closed: an
 * unknown/unclassified class yields null and is audited as denied — every PII reader
 * is forced to be a registered, purpose-limited data class (DPDP purpose limitation).
 */
export async function gatePiiClass<T>(
  subjectApaar: string,
  classId: string,
  getter: () => T | Promise<T>,
): Promise<T | null> {
  const purpose = gatingPurpose(classId)
  if (!purpose) {
    logger.error("pii read for unclassified data class; denying", { subjectApaar, classId })
    await appendAudit({
      actor: "consent-gate",
      action: "pii.read.denied",
      resource: subjectApaar,
      details: { classId, reason: "unclassified" },
    })
    return null
  }
  return await gatePii(subjectApaar, purpose, getter)
}
