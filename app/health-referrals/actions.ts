"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileReferral, actOnReferral, listReferrals, type NewReferral, type HealthFlowRecord } from "@/lib/healthflow/store"
import type { Decision } from "@/lib/workflow"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listReferralsAction(): Promise<HealthFlowRecord[]> {
  noStore()
  try {
    return await listReferrals()
  } catch (e) {
    logger.error("healthflow.list failed", { error: String(e) })
    return []
  }
}

export async function fileReferralAction(input: NewReferral): Promise<HealthFlowRecord | null> {
  try {
    const rec = await fileReferral(input)
    revalidatePath("/health-referrals")
    return rec
  } catch (e) {
    logger.error("healthflow.file failed", { error: String(e) })
    return null
  }
}

export async function decideReferralAction(input: { id: string; actorRole: string; actor: string; decision: Decision; note?: string }): Promise<{ ok: boolean; record?: HealthFlowRecord; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to act on health referrals." }
  try {
    const res = await actOnReferral(input.id, { actorRole: input.actorRole, actor: input.actor, decision: input.decision, note: input.note })
    revalidatePath("/health-referrals")
    return res
  } catch (e) {
    logger.error("healthflow.decide failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
