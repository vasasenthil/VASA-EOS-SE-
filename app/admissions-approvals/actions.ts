"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileApplicant, actOnApplicant, deleteApplicant, listApplicants, type NewApplicant, type AdmissionFlowRecord } from "@/lib/admissionsflow/store"
import type { Decision } from "@/lib/workflow"
import { canDo } from "@/lib/access/guard"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listApplicantsAction(): Promise<AdmissionFlowRecord[]> {
  noStore()
  try {
    // Per-role jurisdiction scoping: an applicant record (student identity, guardian PII, APAAR)
    // is visible only to a subject whose tenant subtree includes the admitting school. Fail-closed.
    return await scopeForCurrentSubject(await listApplicants())
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

export async function decideApplicantAction(input: { id: string; actorRole: string; actor: string; decision: Decision; note?: string }): Promise<{ ok: boolean; record?: AdmissionFlowRecord; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to process admissions." }
  try {
    const res = await actOnApplicant(input.id, { actorRole: input.actorRole, actor: input.actor, decision: input.decision, note: input.note })
    revalidatePath("/admissions-approvals")
    return res
  } catch (e) {
    logger.error("admissionflow.decide failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
