"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileIndent, actOnIndent, listIndents, type NewIndent, type ProcurementFlowRecord } from "@/lib/procurementflow/store"
import type { Decision } from "@/lib/workflow"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listIndentsAction(): Promise<ProcurementFlowRecord[]> {
  noStore()
  try {
    return await listIndents()
  } catch (e) {
    logger.error("procurementflow.list failed", { error: String(e) })
    return []
  }
}

export async function fileIndentAction(input: NewIndent): Promise<ProcurementFlowRecord | null> {
  try {
    const rec = await fileIndent(input)
    revalidatePath("/procurement-approvals")
    return rec
  } catch (e) {
    logger.error("procurementflow.file failed", { error: String(e) })
    return null
  }
}

export async function decideIndentAction(input: { id: string; actorRole: string; actor: string; decision: Decision; note?: string }): Promise<{ ok: boolean; record?: ProcurementFlowRecord; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to act on procurement." }
  try {
    const res = await actOnIndent(input.id, { actorRole: input.actorRole, actor: input.actor, decision: input.decision, note: input.note })
    revalidatePath("/procurement-approvals")
    return res
  } catch (e) {
    logger.error("procurementflow.decide failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
