"use server"

import { reconcile, type ReconResult } from "@/lib/meals"
import { appendAudit } from "@/lib/audit/trail"
import { can } from "@/lib/access/policy"
import { resolveSubject } from "@/lib/access/resolve"

export interface ReconState {
  result?: ReconResult
  error?: string
}

export async function reconcileAction(_prev: ReconState, formData: FormData): Promise<ReconState> {
  const date = (formData.get("date") as string) || new Date().toISOString().slice(0, 10)
  const attendance = Number(formData.get("attendance"))
  const mealsServed = Number(formData.get("mealsServed"))
  if (!Number.isFinite(attendance) || !Number.isFinite(mealsServed) || attendance < 0 || mealsServed < 0) {
    return { error: "Enter valid attendance and meals-served counts." }
  }
  const decision = can(await resolveSubject(), "manage:meals", { type: "meal-reconciliation", id: date })
  if (!decision.permitted) return { error: `Not allowed: ${decision.reason}` }
  const result = reconcile({ date, attendance, mealsServed })
  await appendAudit({
    actor: "operations",
    action: "pm_poshan.reconcile",
    resource: date,
    details: { variance: result.variance, leakage: result.leakageFlag },
  })
  return { result }
}
