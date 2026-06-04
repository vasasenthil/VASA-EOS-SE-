"use server"

import { integrations } from "@/lib/integrations"
import type { ApaarRecord } from "@/lib/integrations"

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
