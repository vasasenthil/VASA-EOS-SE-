"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformTransportDashboard,
  platformRouteRoster,
  platformRegisterRoute,
  platformAllotSeat,
  platformWithdrawSeat,
  type PlatformTransportDashboard,
  type PlatformTransportAllotment,
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

export async function getTransportDashboard(): Promise<PlatformTransportDashboard | null> {
  try {
    return await platformTransportDashboard(SCOPE)
  } catch (e) {
    logger.error("transport.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getRoster(routeId: string): Promise<PlatformTransportAllotment[]> {
  try {
    return await platformRouteRoster(routeId)
  } catch (e) {
    logger.error("transport.roster failed", { error: String(e) })
    return []
  }
}

/** Seat a student on a route. Capacity + serviceability invariants are enforced by the backbone. */
export async function allotAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:students"))) return { ok: false, message: "You do not have permission to allot seats." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const route_id = String(fd.get("route_id") ?? "").trim()
  const student_id = String(fd.get("student_id") ?? "").trim()
  const stop = String(fd.get("stop") ?? "").trim() || "Stop"
  if (!route_id || !student_id) return { ok: false, message: "Select a route and enter a student id." }
  const id = `ALT-${route_id}-${student_id}`
  try {
    const r = await platformAllotSeat({ id, route_id, student_id, stop, org_unit: SCOPE })
    revalidatePath("/school-transport")
    // a full route or an unserviceable vehicle returns ok:false with the exact safety reason.
    return { ok: r.ok, message: r.ok ? `Seated ${student_id} on ${route_id}.` : r.error || "Allotment rejected." }
  } catch (e) {
    logger.error("transport.allot failed", { error: String(e) })
    return { ok: false, message: `Allotment failed: ${String(e)}` }
  }
}

/** Withdraw a seat (frees capacity). */
export async function withdrawAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:students"))) return { ok: false, message: "You do not have permission to withdraw seats." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Allotment id required." }
  try {
    const r = await platformWithdrawSeat(id)
    revalidatePath("/school-transport")
    return { ok: r.ok, message: r.ok ? `Seat ${id} freed.` : r.error || "Withdraw rejected." }
  } catch (e) {
    logger.error("transport.withdraw failed", { error: String(e) })
    return { ok: false, message: `Withdraw failed: ${String(e)}` }
  }
}

/** Register a school bus route. */
export async function registerRouteAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to register routes." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const name = String(fd.get("name") ?? "").trim()
  const vehicle_no = String(fd.get("vehicle_no") ?? "").trim()
  const capacity = Number(fd.get("capacity") ?? 0)
  const fitness_valid_till = String(fd.get("fitness_valid_till") ?? "").trim()
  const licence_valid_till = String(fd.get("licence_valid_till") ?? "").trim()
  const driver_name = String(fd.get("driver_name") ?? "").trim()
  if (!id || !vehicle_no) return { ok: false, message: "Route id and vehicle number are required." }
  if (!Number.isFinite(capacity) || capacity <= 0) return { ok: false, message: "Capacity must be positive." }
  if (!fitness_valid_till || !licence_valid_till) return { ok: false, message: "Fitness and licence validity dates are required." }
  try {
    const r = await platformRegisterRoute({ id, name, vehicle_no, capacity, fitness_valid_till, driver_name, licence_valid_till, org_unit: SCOPE })
    revalidatePath("/school-transport")
    return { ok: r.ok, message: r.ok ? `Registered route ${id} (${vehicle_no}, ${capacity} seats).` : r.error || "Route rejected." }
  } catch (e) {
    logger.error("transport.route failed", { error: String(e) })
    return { ok: false, message: `Route registration failed: ${String(e)}` }
  }
}
