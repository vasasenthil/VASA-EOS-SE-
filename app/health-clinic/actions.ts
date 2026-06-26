"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformClinicDashboard,
  platformScopedClinicVisits,
  platformOpenClinicVisit,
  platformTreatClinicVisit,
  platformCloseClinicVisit,
  type PlatformClinicDashboard,
  type PlatformClinicVisit,
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

export async function getClinicDashboard(): Promise<PlatformClinicDashboard | null> {
  try {
    return await platformClinicDashboard(SCOPE)
  } catch (e) {
    logger.error("clinic.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getClinicVisits(status = ""): Promise<PlatformClinicVisit[]> {
  try {
    return await platformScopedClinicVisits(SCOPE, status)
  } catch (e) {
    logger.error("clinic.list failed", { error: String(e) })
    return []
  }
}

/** Open a sick-room visit. */
export async function openVisitAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to open clinic visits." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const student_id = String(fd.get("student_id") ?? "").trim()
  const complaint = String(fd.get("complaint") ?? "").trim()
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!student_id) return { ok: false, message: "A student id is required." }
  if (!complaint) return { ok: false, message: "A complaint is required." }
  const id = `CLN-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformOpenClinicVisit({ id, org_unit, student_id, complaint })
    revalidatePath("/health-clinic")
    return { ok: r.ok, message: r.ok ? `Opened visit for ${student_id}.` : r.error || "Open rejected." }
  } catch (e) {
    logger.error("clinic.open failed", { error: String(e) })
    return { ok: false, message: `Open failed: ${String(e)}` }
  }
}

/** Record a treatment. */
export async function treatVisitAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to record treatments." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const note = String(fd.get("note") ?? "").trim()
  if (!id) return { ok: false, message: "Visit id is required." }
  if (!note) return { ok: false, message: "A treatment note is required." }
  try {
    const r = await platformTreatClinicVisit(id, note)
    revalidatePath("/health-clinic")
    return { ok: r.ok, message: r.ok ? `Recorded treatment on ${id}.` : r.error || "Treatment rejected." }
  } catch (e) {
    logger.error("clinic.treat failed", { error: String(e) })
    return { ok: false, message: `Treatment failed: ${String(e)}` }
  }
}

/** Close a visit with an outcome. */
export async function closeVisitAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to close clinic visits." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const outcome = String(fd.get("outcome") ?? "").trim()
  const destination = String(fd.get("destination") ?? "").trim()
  if (!id) return { ok: false, message: "Visit id is required." }
  if (!outcome) return { ok: false, message: "An outcome is required." }
  try {
    const r = await platformCloseClinicVisit(id, outcome, destination)
    revalidatePath("/health-clinic")
    return { ok: r.ok, message: r.ok ? `Closed ${id} (${outcome}).` : r.error || "Close rejected — a referral needs a destination." }
  } catch (e) {
    logger.error("clinic.close failed", { error: String(e) })
    return { ok: false, message: `Close failed: ${String(e)}` }
  }
}
