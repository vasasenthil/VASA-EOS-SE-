"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileResolution, actOnResolution, deleteResolution, listResolutions, type NewResolution, type SmcFlowRecord } from "@/lib/smcflow/store"
import type { Decision } from "@/lib/workflow"
import { logger } from "@/lib/logger"

export async function listResolutionsAction(): Promise<SmcFlowRecord[]> {
  noStore()
  try {
    return await listResolutions()
  } catch (e) {
    logger.error("smcflow.list failed", { error: String(e) })
    return []
  }
}

export async function fileResolutionAction(input: NewResolution): Promise<SmcFlowRecord | null> {
  try {
    const rec = await fileResolution(input)
    revalidatePath("/smc-approvals")
    return rec
  } catch (e) {
    logger.error("smcflow.file failed", { error: String(e) })
    return null
  }
}

export async function decideResolutionAction(input: { id: string; actorRole: string; actor: string; decision: Decision }): Promise<{ ok: boolean; record?: SmcFlowRecord; reason?: string }> {
  try {
    const res = await actOnResolution(input.id, { actorRole: input.actorRole, actor: input.actor, decision: input.decision })
    revalidatePath("/smc-approvals")
    return res
  } catch (e) {
    logger.error("smcflow.decide failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
