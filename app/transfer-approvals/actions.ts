"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileTransfer, actOnTransfer, listTransfers, type NewTransfer, type TransferFlowRecord } from "@/lib/transferflow/store"
import type { Decision } from "@/lib/workflow"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listTransfersAction(): Promise<TransferFlowRecord[]> {
  noStore()
  try {
    return await listTransfers()
  } catch (e) {
    logger.error("transferflow.list failed", { error: String(e) })
    return []
  }
}

export async function fileTransferAction(input: NewTransfer): Promise<TransferFlowRecord | null> {
  try {
    const rec = await fileTransfer(input)
    revalidatePath("/transfer-approvals")
    return rec
  } catch (e) {
    logger.error("transferflow.file failed", { error: String(e) })
    return null
  }
}

export async function decideTransferAction(input: { id: string; actorRole: string; actor: string; decision: Decision; note?: string }): Promise<{ ok: boolean; record?: TransferFlowRecord; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to act on transfer requests." }
  try {
    const res = await actOnTransfer(input.id, { actorRole: input.actorRole, actor: input.actor, decision: input.decision, note: input.note })
    revalidatePath("/transfer-approvals")
    return res
  } catch (e) {
    logger.error("transferflow.decide failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
