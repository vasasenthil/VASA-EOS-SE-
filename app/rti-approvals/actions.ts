"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileRti, actOnRti, listRtis, type NewRti, type RtiFlowRecord } from "@/lib/rtiflow/store"
import type { Decision } from "@/lib/workflow"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listRtisAction(): Promise<RtiFlowRecord[]> {
  noStore()
  try {
    return await listRtis()
  } catch (e) {
    logger.error("rtiflow.list failed", { error: String(e) })
    return []
  }
}

export async function fileRtiAction(input: NewRti): Promise<RtiFlowRecord | null> {
  try {
    const rec = await fileRti(input)
    revalidatePath("/rti-approvals")
    return rec
  } catch (e) {
    logger.error("rtiflow.file failed", { error: String(e) })
    return null
  }
}

export async function decideRtiAction(input: { id: string; actorRole: string; actor: string; decision: Decision; note?: string }): Promise<{ ok: boolean; record?: RtiFlowRecord; reason?: string }> {
  if (!(await canDo("manage:governance"))) return { ok: false, reason: "You do not have permission to act on RTI requests." }
  try {
    const res = await actOnRti(input.id, { actorRole: input.actorRole, actor: input.actor, decision: input.decision, note: input.note })
    revalidatePath("/rti-approvals")
    return res
  } catch (e) {
    logger.error("rtiflow.decide failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
