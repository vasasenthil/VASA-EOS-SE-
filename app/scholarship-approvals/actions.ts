"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileScholarship, actOnScholarship, listScholarships, type NewScholarship, type ScholarshipFlowRecord } from "@/lib/scholarshipflow/store"
import type { Decision } from "@/lib/workflow"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listScholarshipsAction(): Promise<ScholarshipFlowRecord[]> {
  noStore()
  try {
    return await listScholarships()
  } catch (e) {
    logger.error("scholarshipflow.list failed", { error: String(e) })
    return []
  }
}

export async function fileScholarshipAction(input: NewScholarship): Promise<ScholarshipFlowRecord | null> {
  try {
    const rec = await fileScholarship(input)
    revalidatePath("/scholarship-approvals")
    return rec
  } catch (e) {
    logger.error("scholarshipflow.file failed", { error: String(e) })
    return null
  }
}

export async function decideScholarshipAction(input: { id: string; actorRole: string; actor: string; decision: Decision; note?: string }): Promise<{ ok: boolean; record?: ScholarshipFlowRecord; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to sanction benefits." }
  try {
    const res = await actOnScholarship(input.id, { actorRole: input.actorRole, actor: input.actor, decision: input.decision, note: input.note })
    revalidatePath("/scholarship-approvals")
    return res
  } catch (e) {
    logger.error("scholarshipflow.decide failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
