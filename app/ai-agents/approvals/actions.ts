"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listToolRequests, decideToolRequest, type ToolRequest } from "@/lib/agentflow/store"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listToolRequestsAction(): Promise<ToolRequest[]> {
  noStore()
  try {
    return await listToolRequests()
  } catch (e) {
    logger.error("agentflow.list failed", { error: String(e) })
    return []
  }
}

export async function decideToolRequestAction(
  id: string,
  approve: boolean,
): Promise<{ ok: boolean; request?: ToolRequest; reason?: string }> {
  // Approving a side-effecting agent action is a privileged, audited decision.
  if (!(await canDo("manage:governance"))) return { ok: false, reason: "You do not have permission to decide agent actions." }
  try {
    const res = await decideToolRequest(id, approve, "approver (demo)")
    revalidatePath("/ai-agents/approvals")
    return res
  } catch (e) {
    logger.error("agentflow.decide failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
