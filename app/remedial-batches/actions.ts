"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformRemedialDashboard,
  platformScopedRemedialBatches,
  platformCreateRemedialBatch,
  platformEnrolRemedial,
  platformGraduateRemedial,
  platformCloseRemedialBatch,
  type PlatformRemedialDashboard,
  type PlatformRemedialBatch,
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

export async function getRemedialDashboard(): Promise<PlatformRemedialDashboard | null> {
  try {
    return await platformRemedialDashboard(SCOPE)
  } catch (e) {
    logger.error("remedial.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getRemedialBatches(status = ""): Promise<PlatformRemedialBatch[]> {
  try {
    return await platformScopedRemedialBatches(SCOPE, status)
  } catch (e) {
    logger.error("remedial.list failed", { error: String(e) })
    return []
  }
}

/** Open a remedial batch. */
export async function createBatchAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to open remedial batches." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const subject = String(fd.get("subject") ?? "").trim()
  const target_level = Number.parseInt(String(fd.get("target_level") ?? "0"), 10)
  const capacity = Number.parseInt(String(fd.get("capacity") ?? "0"), 10)
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!subject) return { ok: false, message: "A subject is required." }
  if (!Number.isFinite(target_level) || target_level < 1 || target_level > 5) return { ok: false, message: "Target level must be 1–5." }
  if (!Number.isFinite(capacity) || capacity < 1) return { ok: false, message: "Capacity must be at least 1." }
  const id = `REM-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformCreateRemedialBatch({ id, org_unit, subject, target_level, capacity })
    revalidatePath("/remedial-batches")
    return { ok: r.ok, message: r.ok ? `Opened ${subject} batch (target L${target_level}, cap ${capacity}).` : r.error || "Create rejected." }
  } catch (e) {
    logger.error("remedial.create failed", { error: String(e) })
    return { ok: false, message: `Create failed: ${String(e)}` }
  }
}

/** Enrol a below-target student. */
export async function enrolAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to enrol students." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const student_id = String(fd.get("student_id") ?? "").trim()
  const level = Number.parseInt(String(fd.get("level") ?? "0"), 10)
  if (!id) return { ok: false, message: "Batch id is required." }
  if (!student_id) return { ok: false, message: "A student id is required." }
  if (!Number.isFinite(level) || level < 0) return { ok: false, message: "Diagnostic level must be non-negative." }
  try {
    const r = await platformEnrolRemedial({ id, student_id, level })
    revalidatePath("/remedial-batches")
    return { ok: r.ok, message: r.ok ? `Enrolled ${student_id} at L${level}.` : r.error || "Enrolment rejected." }
  } catch (e) {
    logger.error("remedial.enrol failed", { error: String(e) })
    return { ok: false, message: `Enrolment failed: ${String(e)}` }
  }
}

/** Graduate a now-proficient student. */
export async function graduateAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to graduate students." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const student_id = String(fd.get("student_id") ?? "").trim()
  const exit_level = Number.parseInt(String(fd.get("exit_level") ?? "0"), 10)
  if (!id) return { ok: false, message: "Batch id is required." }
  if (!student_id) return { ok: false, message: "A student id is required." }
  if (!Number.isFinite(exit_level) || exit_level < 0) return { ok: false, message: "Exit level must be non-negative." }
  try {
    const r = await platformGraduateRemedial({ id, student_id, exit_level })
    revalidatePath("/remedial-batches")
    return { ok: r.ok, message: r.ok ? `Graduated ${student_id} at L${exit_level}.` : r.error || "Graduation rejected — not yet proficient." }
  } catch (e) {
    logger.error("remedial.graduate failed", { error: String(e) })
    return { ok: false, message: `Graduation failed: ${String(e)}` }
  }
}

/** Close a remedial batch. */
export async function closeBatchAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to close batches." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Batch id is required." }
  try {
    const r = await platformCloseRemedialBatch(id)
    revalidatePath("/remedial-batches")
    return { ok: r.ok, message: r.ok ? `Closed ${id}.` : r.error || "Close rejected." }
  } catch (e) {
    logger.error("remedial.close failed", { error: String(e) })
    return { ok: false, message: `Close failed: ${String(e)}` }
  }
}
