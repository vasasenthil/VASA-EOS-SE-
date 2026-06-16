"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileIncident, actOnIncident, listIncidents, type NewIncident, type SafetyFlowRecord } from "@/lib/safetyflow/store"
import type { Decision } from "@/lib/workflow"
import { canDo } from "@/lib/access/guard"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listIncidentsAction(): Promise<SafetyFlowRecord[]> {
  noStore()
  try {
    // Per-role jurisdiction scoping: a POCSO/child-safety case is visible only to a subject
    // whose tenant subtree includes the reporting school. Fail-closed (empty).
    return await scopeForCurrentSubject(await listIncidents())
  } catch (e) {
    logger.error("safetyflow.list failed", { error: String(e) })
    return []
  }
}

export async function fileIncidentAction(input: NewIncident): Promise<SafetyFlowRecord | null> {
  try {
    const rec = await fileIncident(input)
    revalidatePath("/safety-incidents")
    return rec
  } catch (e) {
    logger.error("safetyflow.file failed", { error: String(e) })
    return null
  }
}

export async function decideIncidentAction(input: { id: string; actorRole: string; actor: string; decision: Decision; note?: string }): Promise<{ ok: boolean; record?: SafetyFlowRecord; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to act on safety incidents." }
  try {
    const res = await actOnIncident(input.id, { actorRole: input.actorRole, actor: input.actor, decision: input.decision, note: input.note })
    revalidatePath("/safety-incidents")
    return res
  } catch (e) {
    logger.error("safetyflow.decide failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
