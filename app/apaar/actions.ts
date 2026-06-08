"use server"

import { integrations } from "@/lib/integrations"
import type { ApaarRecord } from "@/lib/integrations"
import { gatePii } from "@/lib/consent/gate-server"
import { gatingPurpose } from "@/lib/consent/pii-catalogue"
import { logger } from "@/lib/logger"

/**
 * Consent-gated APAAR identity read (reference #2). The lifelong learner record is
 * released only when the gating purpose for the "identity" PII class is on file for
 * that APAAR id; otherwise null. Decision is audited by the consent gate.
 */
export async function resolveApaarAction(apaarId: string): Promise<ApaarRecord | null> {
  const purpose = gatingPurpose("identity") ?? "aadhaar_linkage"
  try {
    return await gatePii(apaarId, purpose, async () => {
      const res = await integrations.identity.getApaar(apaarId)
      return res.ok ? res.data ?? null : null
    })
  } catch (e) {
    logger.error("apaar.resolve failed", { error: String(e) })
    return null
  }
}

export interface ApaarState {
  record?: ApaarRecord
  duplicates?: { apaarId: string; score: number }[]
  error?: string
  mode?: "mock" | "live"
}

export async function provisionApaarAction(_prev: ApaarState, formData: FormData): Promise<ApaarState> {
  const name = ((formData.get("name") as string) || "").trim()
  const dateOfBirth = ((formData.get("dob") as string) || "").trim() || undefined
  const aadhaarConsent = formData.get("consent") === "on"
  if (!name) return { error: "Student name is required." }

  // AI-assisted dedup before issuing a new lifelong id.
  const dup = await integrations.identity.findDuplicate({ name, dateOfBirth })
  if (dup.ok && (dup.data?.length ?? 0) > 0) {
    return { duplicates: dup.data, error: "Possible existing APAAR(s) found — review before provisioning.", mode: dup.mode }
  }

  const res = await integrations.identity.provisionApaar({ name, dateOfBirth, aadhaarConsent })
  if (!res.ok || !res.data) return { error: res.error ?? "Provisioning failed.", mode: res.mode }
  return { record: res.data, mode: res.mode }
}
