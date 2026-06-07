"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileApplicant, actOnApplicant, deleteApplicant, listApplicants, type NewApplicant, type AdmissionFlowRecord } from "@/lib/admissionsflow/store"
import type { Decision } from "@/lib/workflow"
import { logger } from "@/lib/logger"

export async function listApplicantsAction(): Promise<AdmissionFlowRecord[]> {
  noStore()
  try {
    return await listApplicants()
  } catch (e) {
    logger.error("admissionflow.list failed", { error: String(e) })
    return []
  }
}

export async function fileApplicantAction(input: NewApplicant): Promise<AdmissionFlowRecord | null> {
  try {
    const rec = await fileApplicant(input)
    revalidatePath("/admissions-approvals")
    return rec
  } catch (e) {
    logger.error("admissionflow.file failed", { error: String(e) })
    return null
  }
}

export async function decideApplicantAction(input: { id: string; actorRole: string; actor: string; decision: Decision }): Promise<{ ok: boolean; record?: AdmissionFlowRecord; reason?: string }> {
  try {
    const res = await actOnApplicant(input.id, { actorRole: input.actorRole, actor: input.actor, decision: input.decision })
    revalidatePath("/admissions-approvals")
    return res
  } catch (e) {
    logger.error("admissionflow.decide failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
