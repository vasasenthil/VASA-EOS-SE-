"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformVehicleFitnessDashboard,
  platformScopedVehicles,
  platformRegisterVehicle,
  platformRecordDoc,
  platformClearVehicle,
  type PlatformVehicleFitnessDashboard,
  type PlatformFitnessVehicle,
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

export async function getVehicleFitnessDashboard(): Promise<PlatformVehicleFitnessDashboard | null> {
  try {
    return await platformVehicleFitnessDashboard(SCOPE)
  } catch (e) {
    logger.error("vehiclefitness.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getVehicles(status = ""): Promise<PlatformFitnessVehicle[]> {
  try {
    return await platformScopedVehicles(SCOPE, status)
  } catch (e) {
    logger.error("vehiclefitness.list failed", { error: String(e) })
    return []
  }
}

/** Register a vehicle. */
export async function registerVehicleAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to register vehicles." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const reg_no = String(fd.get("reg_no") ?? "").trim()
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!reg_no) return { ok: false, message: "A registration number is required." }
  const id = `VEH-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformRegisterVehicle({ id, org_unit, reg_no })
    revalidatePath("/vehicle-fitness")
    return { ok: r.ok, message: r.ok ? `Registered ${reg_no}.` : r.error || "Register rejected." }
  } catch (e) {
    logger.error("vehiclefitness.register failed", { error: String(e) })
    return { ok: false, message: `Register failed: ${String(e)}` }
  }
}

/** Record a statutory document. */
export async function recordDocAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to record documents." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const kind = String(fd.get("kind") ?? "").trim()
  const valid = String(fd.get("valid") ?? "true") === "true"
  const expiry = String(fd.get("expiry") ?? "").trim()
  if (!id) return { ok: false, message: "Vehicle id is required." }
  if (!kind) return { ok: false, message: "A document kind is required." }
  try {
    const r = await platformRecordDoc({ id, kind, valid, expiry })
    revalidatePath("/vehicle-fitness")
    return { ok: r.ok, message: r.ok ? `Recorded ${kind} (${valid ? "valid" : "lapsed"}).` : r.error || "Record rejected." }
  } catch (e) {
    logger.error("vehiclefitness.record failed", { error: String(e) })
    return { ok: false, message: `Record failed: ${String(e)}` }
  }
}

/** Clear a vehicle for service. */
export async function clearVehicleAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to clear vehicles." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Vehicle id is required." }
  try {
    const r = await platformClearVehicle(id)
    revalidatePath("/vehicle-fitness")
    return { ok: r.ok, message: r.ok ? `Cleared ${id} for service.` : r.error || "Clearance rejected — a required document is invalid." }
  } catch (e) {
    logger.error("vehiclefitness.clear failed", { error: String(e) })
    return { ok: false, message: `Clearance failed: ${String(e)}` }
  }
}
