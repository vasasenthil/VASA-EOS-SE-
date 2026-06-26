"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformTeacherTransferDashboard,
  platformScopedTeacherTransfers,
  platformRequestTeacherTransfer,
  platformApproveTeacherTransfer,
  platformPostTeacherTransfer,
  platformRejectTeacherTransfer,
  type PlatformTeacherTransferDashboard,
  type PlatformTeacherTransfer,
} from "@/lib/platform-client"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

const SCOPE = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"

export interface ActionResult {
  ok: boolean
  message: string
}

export async function backboneConnected(): Promise<boolean> {
  return platformReachable()
}

export async function getTransferDashboard(): Promise<PlatformTeacherTransferDashboard | null> {
  try {
    return await platformTeacherTransferDashboard(SCOPE)
  } catch (e) {
    logger.error("teacher-transfer.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getTransferList(status = ""): Promise<PlatformTeacherTransfer[]> {
  try {
    return await platformScopedTeacherTransfers(SCOPE, status)
  } catch (e) {
    logger.error("teacher-transfer.list failed", { error: String(e) })
    return []
  }
}

/** Raise a teacher transfer request (status requested). */
export async function requestTransferAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:staff"))) return { ok: false, message: "You do not have permission to request transfers." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const employee_id = String(fd.get("employee_id") ?? "").trim()
  const name = String(fd.get("name") ?? "").trim()
  const cadre = String(fd.get("cadre") ?? "").trim()
  const from_org = String(fd.get("from_org") ?? "").trim()
  const to_org = String(fd.get("to_org") ?? "").trim()
  const reason = String(fd.get("reason") ?? "request").trim()
  if (!employee_id) return { ok: false, message: "An employee id is required." }
  if (!cadre) return { ok: false, message: "A cadre is required." }
  if (!from_org || !to_org) return { ok: false, message: "From and destination schools are required." }
  const id = `TT-${to_org}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformRequestTeacherTransfer({ id, employee_id, name, cadre, from_org, to_org, reason })
    revalidatePath("/teacher-transfer")
    return { ok: r.ok, message: r.ok ? `Requested transfer of ${employee_id} → ${to_org}.` : r.error || "Request rejected." }
  } catch (e) {
    logger.error("teacher-transfer.request failed", { error: String(e) })
    return { ok: false, message: `Request failed: ${String(e)}` }
  }
}

/** Approve a requested transfer — rejected unless the destination has a sanctioned vacancy (cross-module). */
export async function approveTransferAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:staff"))) return { ok: false, message: "You do not have permission to approve transfers." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Request id is required." }
  try {
    const r = await platformApproveTeacherTransfer(id)
    revalidatePath("/teacher-transfer")
    return { ok: r.ok, message: r.ok ? `Approved ${id} → ${r.transfer?.to_org}.` : r.error || "Approve rejected." }
  } catch (e) {
    logger.error("teacher-transfer.approve failed", { error: String(e) })
    return { ok: false, message: `Approve failed: ${String(e)}` }
  }
}

/** Finalise an approved transfer (post the teacher). */
export async function postTransferAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:staff"))) return { ok: false, message: "You do not have permission to post transfers." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Request id is required." }
  try {
    const r = await platformPostTeacherTransfer(id)
    revalidatePath("/teacher-transfer")
    return { ok: r.ok, message: r.ok ? `Posted ${id}.` : r.error || "Post rejected." }
  } catch (e) {
    logger.error("teacher-transfer.post failed", { error: String(e) })
    return { ok: false, message: `Post failed: ${String(e)}` }
  }
}

/** Reject a requested transfer. */
export async function rejectTransferAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:staff"))) return { ok: false, message: "You do not have permission to reject transfers." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const note = String(fd.get("note") ?? "").trim()
  if (!id) return { ok: false, message: "Request id is required." }
  try {
    const r = await platformRejectTeacherTransfer(id, note)
    revalidatePath("/teacher-transfer")
    return { ok: r.ok, message: r.ok ? `Rejected ${id}.` : r.error || "Reject rejected." }
  } catch (e) {
    logger.error("teacher-transfer.reject failed", { error: String(e) })
    return { ok: false, message: `Reject failed: ${String(e)}` }
  }
}
