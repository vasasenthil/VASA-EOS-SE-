"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileGrievanceFlow, actOnGrievance, listGrievanceFlows, type NewGrievance, type GrievanceFlowRecord } from "@/lib/grievanceflow/store"
import type { ActionRecord, Decision, InstanceStatus } from "@/lib/workflow"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"
import {
  platformConfigured,
  platformFileGrievance,
  platformActGrievance,
  platformListGrievance,
  type PlatformGrievanceCase,
} from "@/lib/platform-client"

// The school head is "PRINCIPAL" in the app; the backbone tier uses "HEAD_TEACHER".
function backendRole(role: string): string {
  return role === "PRINCIPAL" ? "HEAD_TEACHER" : role
}

// The Go grievance service validates the category; map the app's free categories onto the canonical set.
function backendCategory(category: string): string {
  const c = category.toLowerCase()
  if (["academic", "infrastructure", "safety", "financial", "service"].includes(c)) return c
  if (c.includes("safe") || c.includes("pocso") || c.includes("child")) return "safety"
  if (c.includes("fee") || c.includes("fund") || c.includes("scholar") || c.includes("dbt")) return "financial"
  if (c.includes("infra") || c.includes("building") || c.includes("water") || c.includes("toilet")) return "infrastructure"
  if (c.includes("exam") || c.includes("mark") || c.includes("academic") || c.includes("teach")) return "academic"
  return "service"
}

// Adapt a backbone grievance.Grievance into the board's GrievanceFlowRecord (synthesising the workflow
// instance from the persisted escalation chain), so the existing board renders platform-backed cases unchanged.
function toRecord(g: PlatformGrievanceCase): GrievanceFlowRecord {
  const status: InstanceStatus =
    g.status === "resolved" ? "approved" : g.status === "rejected" ? "rejected" : "in_progress"
  const history: ActionRecord[] = (g.escalation_chain ?? [])
    .filter((s) => s.decision === "resolved" || s.decision === "rejected" || s.decision === "escalated")
    .map((s) => ({
      stepId: s.role,
      actorRole: s.role,
      actor: s.decided_by ?? "",
      decision: (s.decision === "rejected" ? "reject" : s.decision === "escalated" ? "approve" : "resolve") as Decision,
      at: s.decided_at ?? "",
      note: s.note,
    }))
  return {
    id: g.id,
    applicant: g.complainant,
    category: g.category,
    description: g.subject,
    instance: {
      id: g.id,
      defId: "grievance-redressal",
      context: { category: g.category, orgUnit: g.org_unit, dueAt: g.due_at, tier: g.current_tier },
      status,
      stepIndex: g.current_tier,
      approvalsInStep: 0,
      history,
      startedAt: g.filed_at,
    },
  }
}

export async function listGrievanceFlowsAction(): Promise<GrievanceFlowRecord[]> {
  noStore()
  try {
    if (platformConfigured()) {
      const rows = await platformListGrievance(process.env.PLATFORM_DEFAULT_ORG ?? "TN")
      return rows.map(toRecord)
    }
    return await listGrievanceFlows()
  } catch (e) {
    logger.error("grievanceflow.list failed", { error: String(e) })
    return []
  }
}

export async function fileGrievanceFlowAction(input: NewGrievance): Promise<GrievanceFlowRecord | null> {
  try {
    if (platformConfigured()) {
      const out = await platformFileGrievance({
        complainant: input.applicant,
        category: backendCategory(input.category),
        subject: input.description,
        org_unit: input.details?.school,
      })
      if (!out.ok) {
        logger.error("grievanceflow.file (platform) rejected", { error: out.error })
        return null
      }
      revalidatePath("/grievance-approvals")
      return toRecord(out.case)
    }
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
    if (platformConfigured()) {
      const action = input.decision === "reject" ? "reject" : "resolve"
      const out = await platformActGrievance(input.id, action, backendRole(input.actorRole), input.actor, input.note)
      if (!out.ok) return { ok: false, reason: out.error }
      revalidatePath("/grievance-approvals")
      return { ok: true, record: toRecord(out.case) }
    }
    const res = await actOnGrievance(input.id, { actorRole: input.actorRole, actor: input.actor, decision: input.decision, note: input.note })
    revalidatePath("/grievance-approvals")
    return res
  } catch (e) {
    logger.error("grievanceflow.act failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
