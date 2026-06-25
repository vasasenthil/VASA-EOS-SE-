"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileTc, actOnTc, listTcs, type NewTc, type TcFlowRecord } from "@/lib/tcflow/store"
import type { Decision } from "@/lib/workflow"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listTcsAction(): Promise<TcFlowRecord[]> {
  noStore()
  try {
    return await listTcs()
  } catch (e) {
    logger.error("tcflow.list failed", { error: String(e) })
    return []
  }
}

export async function fileTcAction(input: NewTc): Promise<TcFlowRecord | null> {
  try {
    const rec = await fileTc(input)
    revalidatePath("/tc-approvals")
    return rec
  } catch (e) {
    logger.error("tcflow.file failed", { error: String(e) })
    return null
  }
}

export async function decideTcAction(input: { id: string; actorRole: string; actor: string; decision: Decision; note?: string }): Promise<{ ok: boolean; record?: TcFlowRecord; reason?: string }> {
  if (!(await canDo("manage:students"))) return { ok: false, reason: "You do not have permission to act on transfer certificates." }
  try {
    const res = await actOnTc(input.id, { actorRole: input.actorRole, actor: input.actor, decision: input.decision, note: input.note })
    revalidatePath("/tc-approvals")
    return res
  } catch (e) {
    logger.error("tcflow.decide failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
