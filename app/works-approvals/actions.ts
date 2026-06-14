"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileWorks, actOnWorks, listWorks, type NewWorks, type InfraFlowRecord } from "@/lib/infraflow/store"
import type { Decision } from "@/lib/workflow"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listWorksAction(): Promise<InfraFlowRecord[]> {
  noStore()
  try {
    return await listWorks()
  } catch (e) {
    logger.error("infraflow.list failed", { error: String(e) })
    return []
  }
}

export async function fileWorksAction(input: NewWorks): Promise<InfraFlowRecord | null> {
  try {
    const rec = await fileWorks(input)
    revalidatePath("/works-approvals")
    return rec
  } catch (e) {
    logger.error("infraflow.file failed", { error: String(e) })
    return null
  }
}

export async function decideWorksAction(input: { id: string; actorRole: string; actor: string; decision: Decision; note?: string }): Promise<{ ok: boolean; record?: InfraFlowRecord; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to act on works proposals." }
  try {
    const res = await actOnWorks(input.id, { actorRole: input.actorRole, actor: input.actor, decision: input.decision, note: input.note })
    revalidatePath("/works-approvals")
    return res
  } catch (e) {
    logger.error("infraflow.decide failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
