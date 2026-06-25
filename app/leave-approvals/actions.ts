"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileLeaveFlow, actOnLeave, deleteLeaveFlow, listLeaveFlows, type NewLeaveFlow, type LeaveFlowRecord } from "@/lib/leaveflow/store"
import type { ActionRecord, Decision, InstanceStatus } from "@/lib/workflow"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"
import {
  platformConfigured,
  platformFileLeave,
  platformDecideLeave,
  platformListLeave,
  type PlatformLeaveRequest,
} from "@/lib/platform-client"

// The UI labels the school head "PRINCIPAL"; the backbone chain uses "HEAD_TEACHER". Normalise both ways.
function backendRole(role: string): string {
  return role === "PRINCIPAL" ? "HEAD_TEACHER" : role
}

// Adapt a Go backbone leave.Request into the UI's LeaveFlowRecord (synthesising the workflow instance from the
// persisted approval chain), so the existing board renders platform-backed records unchanged.
function toRecord(r: PlatformLeaveRequest): LeaveFlowRecord {
  const status: InstanceStatus = r.status === "approved" ? "approved" : r.status === "rejected" ? "rejected" : "in_progress"
  const history: ActionRecord[] = (r.approval_chain ?? [])
    .filter((s) => s.decision === "approved" || s.decision === "rejected")
    .map((s) => ({
      stepId: s.role,
      actorRole: s.role,
      actor: s.decided_by ?? "",
      decision: (s.decision === "approved" ? "approve" : "reject") as Decision,
      at: s.decided_at ?? "",
      note: s.note,
    }))
  return {
    id: r.id,
    teacher: r.employee,
    type: r.type as LeaveFlowRecord["type"],
    from: r.from_date,
    to: r.to_date,
    days: r.days,
    reason: r.reason ?? "",
    instance: {
      id: r.id,
      defId: "leave-approval",
      context: { days: r.days, orgUnit: r.org_unit },
      status,
      stepIndex: r.current_step,
      approvalsInStep: 0,
      history,
      startedAt: r.created_at,
    },
  }
}

export async function listLeaveFlowsAction(): Promise<LeaveFlowRecord[]> {
  noStore()
  try {
    if (platformConfigured()) {
      const rows = await platformListLeave(process.env.PLATFORM_DEFAULT_ORG ?? "TN")
      return rows.map(toRecord)
    }
    return await listLeaveFlows()
  } catch (e) {
    logger.error("leaveflow.list failed", { error: String(e) })
    return []
  }
}

export async function fileLeaveFlowAction(input: NewLeaveFlow): Promise<LeaveFlowRecord | null> {
  try {
    if (platformConfigured()) {
      const out = await platformFileLeave({
        employee: input.teacher,
        type: input.type,
        from_date: input.from,
        to_date: input.to,
        reason: input.reason,
      })
      if (!out.ok) {
        logger.error("leaveflow.file (platform) rejected", { error: out.error })
        return null
      }
      revalidatePath("/leave-approvals")
      return toRecord(out.request)
    }
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
  if (!(await canDo("approve:leave"))) return { ok: false, reason: "You do not have permission to act on leave approvals." }
  try {
    if (platformConfigured()) {
      const out = await platformDecideLeave(
        input.id,
        input.decision !== "reject",
        backendRole(input.actorRole),
        input.actor,
        input.note,
      )
      if (!out.ok) return { ok: false, reason: out.error }
      revalidatePath("/leave-approvals")
      return { ok: true, record: toRecord(out.request) }
    }
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
