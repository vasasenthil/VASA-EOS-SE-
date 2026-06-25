"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { raiseTicketFlow, actOnTicket, deleteTicketFlow, listTicketFlows, type NewTicket, type MaintFlowRecord } from "@/lib/maintenanceflow/store"
import type { Decision } from "@/lib/workflow"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listTicketFlowsAction(): Promise<MaintFlowRecord[]> {
  noStore()
  try {
    return await listTicketFlows()
  } catch (e) {
    logger.error("maintflow.list failed", { error: String(e) })
    return []
  }
}

export async function raiseTicketFlowAction(input: NewTicket): Promise<MaintFlowRecord | null> {
  try {
    const rec = await raiseTicketFlow(input)
    revalidatePath("/maintenance-approvals")
    return rec
  } catch (e) {
    logger.error("maintflow.raise failed", { error: String(e) })
    return null
  }
}

export async function actTicketAction(input: { id: string; actorRole: string; actor: string; decision: Decision; note?: string }): Promise<{ ok: boolean; record?: MaintFlowRecord; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to act on maintenance tickets." }
  try {
    const res = await actOnTicket(input.id, { actorRole: input.actorRole, actor: input.actor, decision: input.decision, note: input.note })
    revalidatePath("/maintenance-approvals")
    return res
  } catch (e) {
    logger.error("maintflow.act failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
