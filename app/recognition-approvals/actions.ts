"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileRecognition, actOnRecognition, deleteRecognition, listRecognitions, type NewRecognition, type RecognitionFlowRecord } from "@/lib/recognitionflow/store"
import type { Decision } from "@/lib/workflow"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listRecognitionsAction(): Promise<RecognitionFlowRecord[]> {
  noStore()
  try {
    return await listRecognitions()
  } catch (e) {
    logger.error("recognitionflow.list failed", { error: String(e) })
    return []
  }
}

export async function fileRecognitionAction(input: NewRecognition): Promise<RecognitionFlowRecord | null> {
  try {
    const rec = await fileRecognition(input)
    revalidatePath("/recognition-approvals")
    return rec
  } catch (e) {
    logger.error("recognitionflow.file failed", { error: String(e) })
    return null
  }
}

export async function decideRecognitionAction(input: { id: string; actorRole: string; actor: string; decision: Decision }): Promise<{ ok: boolean; record?: RecognitionFlowRecord; reason?: string }> {
  if (!(await canDo("approve:recognition"))) return { ok: false, reason: "You do not have permission to act on recognition applications." }
  try {
    const res = await actOnRecognition(input.id, { actorRole: input.actorRole, actor: input.actor, decision: input.decision })
    revalidatePath("/recognition-approvals")
    return res
  } catch (e) {
    logger.error("recognitionflow.decide failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
