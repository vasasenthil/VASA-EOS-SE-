"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformWaterDashboard,
  platformScopedWaterTests,
  platformRegisterWaterSample,
  platformRecordWaterParam,
  platformApproveWater,
  platformFailWater,
  type PlatformWaterDashboard,
  type PlatformWaterTest,
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

export async function getWaterDashboard(): Promise<PlatformWaterDashboard | null> {
  try {
    return await platformWaterDashboard(SCOPE)
  } catch (e) {
    logger.error("water.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getWaterTests(status = ""): Promise<PlatformWaterTest[]> {
  try {
    return await platformScopedWaterTests(SCOPE, status)
  } catch (e) {
    logger.error("water.list failed", { error: String(e) })
    return []
  }
}

/** Register a drinking-water sample. */
export async function registerSampleAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to register water samples." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const source = String(fd.get("source") ?? "").trim()
  const sample_date = String(fd.get("sample_date") ?? "").trim()
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!source) return { ok: false, message: "A water source is required." }
  const id = `WTR-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformRegisterWaterSample({ id, org_unit, source, sample_date })
    revalidatePath("/water-testing")
    return { ok: r.ok, message: r.ok ? `Registered ${source} sample.` : r.error || "Register rejected." }
  } catch (e) {
    logger.error("water.register failed", { error: String(e) })
    return { ok: false, message: `Register failed: ${String(e)}` }
  }
}

/** Record a parameter reading. */
export async function recordParamAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to record readings." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const name = String(fd.get("name") ?? "").trim()
  const value = Number.parseFloat(String(fd.get("value") ?? ""))
  const safe_min = Number.parseFloat(String(fd.get("safe_min") ?? "0"))
  const safe_max = Number.parseFloat(String(fd.get("safe_max") ?? "0"))
  const critical = String(fd.get("critical") ?? "") === "on"
  if (!id) return { ok: false, message: "Sample id is required." }
  if (!name) return { ok: false, message: "A parameter name is required." }
  if (!Number.isFinite(value)) return { ok: false, message: "A numeric reading is required." }
  try {
    const r = await platformRecordWaterParam({ id, name, value, safe_min: safe_min || 0, safe_max: safe_max || 0, critical })
    revalidatePath("/water-testing")
    return { ok: r.ok, message: r.ok ? `Recorded ${name} = ${value}.` : r.error || "Record rejected." }
  } catch (e) {
    logger.error("water.record failed", { error: String(e) })
    return { ok: false, message: `Record failed: ${String(e)}` }
  }
}

/** Approve a sample potable — rejected while any critical parameter is out of range. */
export async function approveWaterAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to approve potability." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Sample id is required." }
  try {
    const r = await platformApproveWater(id)
    revalidatePath("/water-testing")
    return { ok: r.ok, message: r.ok ? `Approved ${id} potable.` : r.error || "Approval rejected — a critical parameter is out of range." }
  } catch (e) {
    logger.error("water.approve failed", { error: String(e) })
    return { ok: false, message: `Approve failed: ${String(e)}` }
  }
}

/** Mark a sample failed — rejected unless a critical parameter is out of range. */
export async function failWaterAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to fail water samples." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const remarks = String(fd.get("remarks") ?? "").trim()
  if (!id) return { ok: false, message: "Sample id is required." }
  try {
    const r = await platformFailWater(id, remarks)
    revalidatePath("/water-testing")
    return { ok: r.ok, message: r.ok ? `Marked ${id} unsafe.` : r.error || "Fail rejected — no critical parameter is out of range." }
  } catch (e) {
    logger.error("water.fail failed", { error: String(e) })
    return { ok: false, message: `Fail failed: ${String(e)}` }
  }
}
