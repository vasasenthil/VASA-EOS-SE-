import "server-only"

// VASA-EOS(SE) — DPDP consent-gating seam for PII reads (Security pillar).
// A server getter that returns student PII calls gatePii(): the data is released
// only when the subject (or their guardian) has granted consent for that purpose.
// Fail-closed — absent/unreachable consent yields null. Every decision is audited.

import { hasConsent } from "./store"
import { consentGranted, type ConsentPurpose, type ConsentRecord } from "./index"
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
