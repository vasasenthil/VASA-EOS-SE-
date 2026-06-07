"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileLeaveFlow, actOnLeave, deleteLeaveFlow, listLeaveFlows, type NewLeaveFlow, type LeaveFlowRecord } from "@/lib/leaveflow/store"
import type { Decision } from "@/lib/workflow"
import { logger } from "@/lib/logger"

export async function listLeaveFlowsAction(): Promise<LeaveFlowRecord[]> {
  noStore()
  try {
    return await listLeaveFlows()
  } catch (e) {
    logger.error("leaveflow.list failed", { error: String(e) })
    return []
  }
}

export async function fileLeaveFlowAction(input: NewLeaveFlow): Promise<LeaveFlowRecord | null> {
  try {
    const rec = await fileLeaveFlow(input)
    revalidatePath("/leave-approvals")
    return rec
  } catch (e) {
    logger.error("leaveflow.file failed", { error: String(e) })
    return null
  }
}

export interface DecideInput {
  id: string
  actorRole: string
  actor: string
  decision: Decision
  note?: string
}

export async function decideLeaveFlowAction(input: DecideInput): Promise<{ ok: boolean; record?: LeaveFlowRecord; reason?: string }> {
  try {
    const res = await actOnLeave(input.id, {
      actorRole: input.actorRole,
      actor: input.actor,
      decision: input.decision,
      note: input.note,
    })
    revalidatePath("/leave-approvals")
    return res
  } catch (e) {
    logger.error("leaveflow.decide failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteLeaveFlowAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteLeaveFlow(id)
    revalidatePath("/leave-approvals")
    return ok
  } catch (e) {
    logger.error("leaveflow.delete failed", { error: String(e) })
    return false
  }
}
