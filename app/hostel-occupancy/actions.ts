"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformHostelDashboard,
  platformScopedHostels,
  platformRegisterHostel,
  platformAllotBed,
  platformVacateBed,
  platformCloseHostel,
  type PlatformHostelDashboard,
  type PlatformHostel,
} from "@/lib/platform-client"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

const SCOPE = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"

export interface ActionResult {
  ok: boolean
  message: string
}

export async function backboneConnected(): Promise<boolean> {
  return platformConfigured()
}

export async function getHostelDashboard(): Promise<PlatformHostelDashboard | null> {
  try {
    return await platformHostelDashboard(SCOPE)
  } catch (e) {
    logger.error("hostel.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getHostels(status = ""): Promise<PlatformHostel[]> {
  try {
    return await platformScopedHostels(SCOPE, status)
  } catch (e) {
    logger.error("hostel.list failed", { error: String(e) })
    return []
  }
}

/** Register (open) a hostel. */
export async function registerHostelAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to register hostels." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const name = String(fd.get("name") ?? "").trim()
  const type = String(fd.get("type") ?? "").trim()
  const capacity = Number.parseInt(String(fd.get("capacity") ?? "0"), 10)
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!name) return { ok: false, message: "A hostel name is required." }
  if (!type) return { ok: false, message: "A type is required." }
  if (!Number.isFinite(capacity) || capacity < 1) return { ok: false, message: "Capacity must be at least 1." }
  const id = `HOS-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformRegisterHostel({ id, org_unit, name, type, capacity })
    revalidatePath("/hostel-occupancy")
    return { ok: r.ok, message: r.ok ? `Registered "${name}" (${type}, capacity ${capacity}).` : r.error || "Register rejected." }
  } catch (e) {
    logger.error("hostel.register failed", { error: String(e) })
    return { ok: false, message: `Register failed: ${String(e)}` }
  }
}

/** Allot a bed — rejected on over-allocation or a second statewide placement. */
export async function allotBedAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:students"))) return { ok: false, message: "You do not have permission to allot beds." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const student_id = String(fd.get("student_id") ?? "").trim()
  if (!id) return { ok: false, message: "Hostel id is required." }
  if (!student_id) return { ok: false, message: "A student id is required." }
  try {
    const r = await platformAllotBed(id, student_id)
    revalidatePath("/hostel-occupancy")
    return { ok: r.ok, message: r.ok ? `Allotted ${student_id} → ${id} (${r.hostel?.residents?.length}/${r.hostel?.capacity}).` : r.error || "Allotment rejected." }
  } catch (e) {
    logger.error("hostel.allot failed", { error: String(e) })
    return { ok: false, message: `Allotment failed: ${String(e)}` }
  }
}

/** Vacate a student's bed. */
export async function vacateBedAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:students"))) return { ok: false, message: "You do not have permission to vacate beds." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const student_id = String(fd.get("student_id") ?? "").trim()
  if (!id || !student_id) return { ok: false, message: "Hostel id and student id are required." }
  try {
    const r = await platformVacateBed(id, student_id)
    revalidatePath("/hostel-occupancy")
    return { ok: r.ok, message: r.ok ? `Vacated ${student_id} from ${id}.` : r.error || "Vacate rejected." }
  } catch (e) {
    logger.error("hostel.vacate failed", { error: String(e) })
    return { ok: false, message: `Vacate failed: ${String(e)}` }
  }
}

/** Close an empty hostel. */
export async function closeHostelAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to close hostels." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Hostel id is required." }
  try {
    const r = await platformCloseHostel(id)
    revalidatePath("/hostel-occupancy")
    return { ok: r.ok, message: r.ok ? `Closed ${id}.` : r.error || "Close rejected." }
  } catch (e) {
    logger.error("hostel.close failed", { error: String(e) })
    return { ok: false, message: `Close failed: ${String(e)}` }
  }
}
