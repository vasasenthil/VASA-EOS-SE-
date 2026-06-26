"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformWashDashboard,
  platformScopedWashRegisters,
  platformRegisterSchoolWash,
  platformRecordWashFacility,
  platformCertifySwachh,
  type PlatformWashDashboard,
  type PlatformWashRegister,
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

export async function getWashDashboard(): Promise<PlatformWashDashboard | null> {
  try {
    return await platformWashDashboard(SCOPE)
  } catch (e) {
    logger.error("wash.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getWashRegisters(status = ""): Promise<PlatformWashRegister[]> {
  try {
    return await platformScopedWashRegisters(SCOPE, status)
  } catch (e) {
    logger.error("wash.list failed", { error: String(e) })
    return []
  }
}

/** Open a school's WASH register. */
export async function registerWashAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to open a WASH register." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const school_name = String(fd.get("school_name") ?? "").trim()
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!school_name) return { ok: false, message: "School name is required." }
  const id = `WASH-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformRegisterSchoolWash({ id, org_unit, school_name })
    revalidatePath("/wash-register")
    return { ok: r.ok, message: r.ok ? `Opened WASH register for ${school_name}.` : r.error || "Register rejected." }
  } catch (e) {
    logger.error("wash.register failed", { error: String(e) })
    return { ok: false, message: `Register failed: ${String(e)}` }
  }
}

/** Record an inspected facility line — rejected on an over-report. */
export async function recordFacilityAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to record WASH inspections." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const category = String(fd.get("category") ?? "").trim()
  const sanctioned_units = Number.parseInt(String(fd.get("sanctioned_units") ?? "0"), 10)
  const functional_units = Number.parseInt(String(fd.get("functional_units") ?? "0"), 10)
  if (!id) return { ok: false, message: "Register id is required." }
  if (!category) return { ok: false, message: "Category is required." }
  if (!Number.isFinite(sanctioned_units) || sanctioned_units < 1) return { ok: false, message: "Sanctioned units must be at least 1." }
  if (!Number.isFinite(functional_units) || functional_units < 0) return { ok: false, message: "Functional units must be non-negative." }
  try {
    const r = await platformRecordWashFacility({ id, category, sanctioned_units, functional_units })
    revalidatePath("/wash-register")
    return { ok: r.ok, message: r.ok ? `Recorded ${category}: ${functional_units}/${sanctioned_units} functional.` : r.error || "Record rejected." }
  } catch (e) {
    logger.error("wash.record failed", { error: String(e) })
    return { ok: false, message: `Record failed: ${String(e)}` }
  }
}

/** Certify a school Swachh — rejected while any critical category is not fully functional. */
export async function certifySwachhAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to certify Swachh status." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Register id is required." }
  try {
    const r = await platformCertifySwachh(id)
    revalidatePath("/wash-register")
    return { ok: r.ok, message: r.ok ? `Certified ${id} Swachh.` : r.error || "Certification rejected — fix the critical facilities first." }
  } catch (e) {
    logger.error("wash.certify failed", { error: String(e) })
    return { ok: false, message: `Certify failed: ${String(e)}` }
  }
}
