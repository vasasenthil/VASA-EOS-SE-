"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileGrievanceFlow, actOnGrievance, deleteGrievanceFlow, listGrievanceFlows, type NewGrievance, type GrievanceFlowRecord } from "@/lib/grievanceflow/store"
import type { Decision } from "@/lib/workflow"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listGrievanceFlowsAction(): Promise<GrievanceFlowRecord[]> {
  noStore()
  try {
    return await listGrievanceFlows()
  } catch (e) {
    logger.error("grievanceflow.list failed", { error: String(e) })
    return []
  }
}

export async function fileGrievanceFlowAction(input: NewGrievance): Promise<GrievanceFlowRecord | null> {
  try {
    const rec = await fileGrievanceFlow(input)
    revalidatePath("/grievance-approvals")
    return rec
  } catch (e) {
    logger.error("grievanceflow.file failed", { error: String(e) })
    return null
  }
}

export async function actGrievanceAction(input: { id: string; actorRole: string; actor: string; decision: Decision; note?: string }): Promise<{ ok: boolean; record?: GrievanceFlowRecord; reason?: string }> {
  if (!(await canDo("resolve:grievance"))) return { ok: false, reason: "You do not have permission to act on grievances." }
  try {
    const res = await actOnGrievance(input.id, { actorRole: input.actorRole, actor: input.actor, decision: input.decision, note: input.note })
    revalidatePath("/grievance-approvals")
    return res
  } catch (e) {
    logger.error("grievanceflow.act failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
