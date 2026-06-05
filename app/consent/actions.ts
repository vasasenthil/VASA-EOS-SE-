"use server"

import { grantConsent, withdrawConsent, listConsents } from "@/lib/consent/store"
import type { ConsentPurpose, ConsentRecord } from "@/lib/consent"
import { getTrail, verifyTrail, type AuditEntry } from "@/lib/audit/trail"
import { can } from "@/lib/access/policy"
import { resolveSubject } from "@/lib/access/resolve"

export interface ConsentState {
  records: ConsentRecord[]
  trail: AuditEntry[]
  verified: boolean
  error?: string
}

export async function consentAction(_prev: ConsentState, formData: FormData): Promise<ConsentState> {
  const apaar = ((formData.get("apaar") as string) || "").trim()
  const purpose = formData.get("purpose") as ConsentPurpose | null
  const op = (formData.get("op") as string) || "grant"
  const actor = ((formData.get("actor") as string) || "").trim() || "guardian"

  if (!apaar || !purpose) {
    return {
      records: await listConsents(),
      trail: await getTrail(),
      verified: await verifyTrail(),
      error: "APAAR id and purpose are required.",
    }
  }
  const decision = can(await resolveSubject(), "manage:consent", { type: "consent", id: apaar })
  if (!decision.permitted) {
    return { records: await listConsents(), trail: await getTrail(), verified: await verifyTrail(), error: `Not allowed: ${decision.reason}` }
  }
  if (op === "withdraw") await withdrawConsent({ subjectApaar: apaar, purpose, actor })
  else await grantConsent({ subjectApaar: apaar, purpose, actor })

  return { records: await listConsents(), trail: await getTrail(), verified: await verifyTrail() }
}
