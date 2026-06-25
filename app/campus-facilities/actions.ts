"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformCifmDashboard,
  platformScopedFacilities,
  platformRegisterFacility,
  platformRaiseWorkOrder,
  platformCompleteWorkOrder,
  platformSetFacilityOperational,
  platformCloseFacility,
  type PlatformCifmDashboard,
  type PlatformFacility,
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

export async function getCifmDashboard(): Promise<PlatformCifmDashboard | null> {
  try {
    return await platformCifmDashboard(SCOPE)
  } catch (e) {
    logger.error("cifm.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getFacilities(status = ""): Promise<PlatformFacility[]> {
  try {
    return await platformScopedFacilities(SCOPE, status)
  } catch (e) {
    logger.error("cifm.list failed", { error: String(e) })
    return []
  }
}

/** Register a facility. */
export async function registerFacilityAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to register facilities." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const name = String(fd.get("name") ?? "").trim()
  const category = String(fd.get("category") ?? "").trim()
  const condition = String(fd.get("condition") ?? "good").trim()
  const amc_vendor = String(fd.get("amc_vendor") ?? "").trim()
  const amc_expiry = String(fd.get("amc_expiry") ?? "").trim()
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!name) return { ok: false, message: "A facility name is required." }
  if (!category) return { ok: false, message: "A category is required." }
  const id = `FAC-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformRegisterFacility({ id, org_unit, name, category, condition, amc_vendor, amc_expiry })
    revalidatePath("/campus-facilities")
    return { ok: r.ok, message: r.ok ? `Registered "${name}" (${category}).` : r.error || "Register rejected." }
  } catch (e) {
    logger.error("cifm.register failed", { error: String(e) })
    return { ok: false, message: `Register failed: ${String(e)}` }
  }
}

/** Raise a work order — a critical one flips the facility to under_maintenance. */
export async function raiseWorkOrderAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to raise work orders." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const wo_title = String(fd.get("wo_title") ?? "").trim()
  const wo_priority = String(fd.get("wo_priority") ?? "medium").trim()
  if (!id) return { ok: false, message: "Facility id is required." }
  if (!wo_title) return { ok: false, message: "A work-order title is required." }
  try {
    const r = await platformRaiseWorkOrder(id, wo_title, wo_priority)
    revalidatePath("/campus-facilities")
    return { ok: r.ok, message: r.ok ? `Raised "${wo_title}" (${wo_priority}) on ${id}.` : r.error || "Work order rejected." }
  } catch (e) {
    logger.error("cifm.raise failed", { error: String(e) })
    return { ok: false, message: `Work order failed: ${String(e)}` }
  }
}

/** Complete a work order. */
export async function completeWorkOrderAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to update work orders." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const wo_id = String(fd.get("wo_id") ?? "").trim()
  if (!id || !wo_id) return { ok: false, message: "Facility id and work-order id are required." }
  try {
    const r = await platformCompleteWorkOrder(id, wo_id)
    revalidatePath("/campus-facilities")
    return { ok: r.ok, message: r.ok ? `Completed ${wo_id}.` : r.error || "Update rejected." }
  } catch (e) {
    logger.error("cifm.complete failed", { error: String(e) })
    return { ok: false, message: `Update failed: ${String(e)}` }
  }
}

/** Return a facility to operational — rejected with an open critical work order. */
export async function setOperationalAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to update facilities." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Facility id is required." }
  try {
    const r = await platformSetFacilityOperational(id)
    revalidatePath("/campus-facilities")
    return { ok: r.ok, message: r.ok ? `${id} returned to operational.` : r.error || "Rejected." }
  } catch (e) {
    logger.error("cifm.operational failed", { error: String(e) })
    return { ok: false, message: `Failed: ${String(e)}` }
  }
}

/** Close a facility (no open work orders). */
export async function closeFacilityAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to close facilities." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Facility id is required." }
  try {
    const r = await platformCloseFacility(id)
    revalidatePath("/campus-facilities")
    return { ok: r.ok, message: r.ok ? `Closed ${id}.` : r.error || "Close rejected." }
  } catch (e) {
    logger.error("cifm.close failed", { error: String(e) })
    return { ok: false, message: `Close failed: ${String(e)}` }
  }
}
