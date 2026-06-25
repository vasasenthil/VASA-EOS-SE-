"use server"

import { integrations } from "@/lib/integrations"
import type { DisbursementResult } from "@/lib/integrations"
import { requireAccess, AccessDeniedError } from "@/lib/access/policy"
import { resolveSubject } from "@/lib/access/resolve"
import { DBT_SCHEMES } from "./schemes"

export interface DbtState {
  result?: DisbursementResult
  eligible?: boolean
  reason?: string
  error?: string
  mode?: "mock" | "live"
}

export async function disburseAction(_prev: DbtState, formData: FormData): Promise<DbtState> {
  const apaar = ((formData.get("apaar") as string) || "").trim()
  const schemeCode = (formData.get("scheme") as string) || "PUDHUMAI_PENN"
  const govtSchool = formData.get("govtSchool") === "on"
  const gender = (formData.get("gender") as string) || ""

  if (!apaar) return { error: "APAAR id is required." }
  const scheme = DBT_SCHEMES[schemeCode]
  if (!scheme) return { error: "Unknown scheme." }

  // High-stakes: disbursement requires explicit authorisation (deny-wins, fail-closed).
  try {
    requireAccess(await resolveSubject(), "disburse:dbt", { type: "scheme", id: schemeCode })
  } catch (e) {
    if (e instanceof AccessDeniedError) return { error: e.message }
    throw e
  }

  // Eligibility (illustrative; real rules verify APAAR-UDISE+ history + Aadhaar dedup).
  if (scheme.girlOnly && gender !== "female") {
    return { eligible: false, reason: `${scheme.label} is for girl students.` }
  }
  if (scheme.govtSchoolOnly && !govtSchool) {
    return { eligible: false, reason: "Requires Classes 6-12 in a government school." }
  }

  const res = await integrations.dbt.disburse({
    beneficiaryApaar: apaar,
    schemeCode,
    amountInPaise: scheme.amountInPaise,
    reference: `${schemeCode}-${Date.now()}`,
  })
  if (!res.ok || !res.data) {
    return { eligible: true, reason: "Eligible", error: res.error ?? "Disbursement failed.", mode: res.mode }
  }
  return { eligible: true, reason: "Eligible", result: res.data, mode: res.mode }
}
