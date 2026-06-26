"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformVisitorDashboard,
  platformScopedVisitorPasses,
  platformCheckInVisitor,
  platformCheckOutVisitor,
  type PlatformVisitorDashboard,
  type PlatformVisitorPass,
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

export async function getVisitorDashboard(): Promise<PlatformVisitorDashboard | null> {
  try {
    return await platformVisitorDashboard(SCOPE)
  } catch (e) {
    logger.error("visitor.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getVisitorPasses(status = ""): Promise<PlatformVisitorPass[]> {
  try {
    return await platformScopedVisitorPasses(SCOPE, status)
  } catch (e) {
    logger.error("visitor.list failed", { error: String(e) })
    return []
  }
}

/** Register a visitor at the gate — rejected on a second concurrent open pass. */
export async function checkInAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to register visitors." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const visitor_id = String(fd.get("visitor_id") ?? "").trim()
  const name = String(fd.get("name") ?? "").trim()
  const purpose = String(fd.get("purpose") ?? "").trim()
  const host = String(fd.get("host") ?? "").trim()
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!visitor_id) return { ok: false, message: "A visitor id is required." }
  if (!name) return { ok: false, message: "A visitor name is required." }
  const id = `VIS-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformCheckInVisitor({ id, org_unit, visitor_id, name, purpose, host })
    revalidatePath("/visitor-gate")
    return { ok: r.ok, message: r.ok ? `Checked in ${name}.` : r.error || "Check-in rejected." }
  } catch (e) {
    logger.error("visitor.checkin failed", { error: String(e) })
    return { ok: false, message: `Check-in failed: ${String(e)}` }
  }
}

/** Record a visitor's exit — rejected on a double check-out. */
export async function checkOutAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to check out visitors." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Pass id is required." }
  try {
    const r = await platformCheckOutVisitor(id)
    revalidatePath("/visitor-gate")
    return { ok: r.ok, message: r.ok ? `Checked out ${id}.` : r.error || "Check-out rejected." }
  } catch (e) {
    logger.error("visitor.checkout failed", { error: String(e) })
    return { ok: false, message: `Check-out failed: ${String(e)}` }
  }
}
