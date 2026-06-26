"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformInvigilationDashboard,
  platformScopedDutySessions,
  platformCreateDutySession,
  platformAssignInvigilator,
  platformUnassignInvigilator,
  platformCloseDutySession,
  type PlatformInvigilationDashboard,
  type PlatformDutySession,
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

export async function getInvigilationDashboard(): Promise<PlatformInvigilationDashboard | null> {
  try {
    return await platformInvigilationDashboard(SCOPE)
  } catch (e) {
    logger.error("invigilation.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getDutySessions(status = ""): Promise<PlatformDutySession[]> {
  try {
    return await platformScopedDutySessions(SCOPE, status)
  } catch (e) {
    logger.error("invigilation.list failed", { error: String(e) })
    return []
  }
}

/** Open an exam session. */
export async function createSessionAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to create sessions." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const exam = String(fd.get("exam") ?? "").trim()
  const date = String(fd.get("date") ?? "").trim()
  const slot = String(fd.get("slot") ?? "").trim()
  const hall = String(fd.get("hall") ?? "").trim()
  const required_invigilators = Number.parseInt(String(fd.get("required_invigilators") ?? "0"), 10)
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!exam || !date || !hall) return { ok: false, message: "Exam, date and hall are required." }
  if (!Number.isFinite(required_invigilators) || required_invigilators < 1) return { ok: false, message: "Required invigilators must be at least 1." }
  const id = `INV-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformCreateDutySession({ id, org_unit, exam, date, slot, hall, required_invigilators })
    revalidatePath("/invigilation-roster")
    return { ok: r.ok, message: r.ok ? `Opened ${exam} ${slot} (${hall}).` : r.error || "Create rejected." }
  } catch (e) {
    logger.error("invigilation.create failed", { error: String(e) })
    return { ok: false, message: `Create failed: ${String(e)}` }
  }
}

/** Roster an invigilator. */
export async function assignAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to roster invigilators." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const teacher = String(fd.get("teacher") ?? "").trim()
  if (!id) return { ok: false, message: "Session id is required." }
  if (!teacher) return { ok: false, message: "An invigilator id is required." }
  try {
    const r = await platformAssignInvigilator(id, teacher)
    revalidatePath("/invigilation-roster")
    return { ok: r.ok, message: r.ok ? `Rostered ${teacher} (${r.session?.invigilators?.length}/${r.session?.required_invigilators}).` : r.error || "Assignment rejected — clash or full." }
  } catch (e) {
    logger.error("invigilation.assign failed", { error: String(e) })
    return { ok: false, message: `Assignment failed: ${String(e)}` }
  }
}

/** Remove an invigilator. */
export async function unassignAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to remove invigilators." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const teacher = String(fd.get("teacher") ?? "").trim()
  if (!id) return { ok: false, message: "Session id is required." }
  if (!teacher) return { ok: false, message: "An invigilator id is required." }
  try {
    const r = await platformUnassignInvigilator(id, teacher)
    revalidatePath("/invigilation-roster")
    return { ok: r.ok, message: r.ok ? `Removed ${teacher} from ${id}.` : r.error || "Removal rejected." }
  } catch (e) {
    logger.error("invigilation.unassign failed", { error: String(e) })
    return { ok: false, message: `Removal failed: ${String(e)}` }
  }
}

/** Finalise a session. */
export async function closeSessionAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to finalise sessions." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Session id is required." }
  try {
    const r = await platformCloseDutySession(id)
    revalidatePath("/invigilation-roster")
    return { ok: r.ok, message: r.ok ? `Finalised ${id}.` : r.error || "Finalise rejected — staff the session fully first." }
  } catch (e) {
    logger.error("invigilation.close failed", { error: String(e) })
    return { ok: false, message: `Finalise failed: ${String(e)}` }
  }
}
