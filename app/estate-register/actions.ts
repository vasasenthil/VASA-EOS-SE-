"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformInfraDashboard,
  platformAssetTickets,
  platformRegisterAsset,
  platformRaiseTicket,
  platformAdvanceTicket,
  platformDecommissionAsset,
  platformReturnAsset,
  type PlatformInfraDashboard,
  type PlatformTicket,
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

export async function getInfraDashboard(): Promise<PlatformInfraDashboard | null> {
  try {
    return await platformInfraDashboard(SCOPE)
  } catch (e) {
    logger.error("infra.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getAssetTickets(assetID: string): Promise<PlatformTicket[]> {
  try {
    return await platformAssetTickets(assetID)
  } catch (e) {
    logger.error("infra.tickets failed", { error: String(e) })
    return []
  }
}

/** Register a new asset on the estate register. */
export async function registerAssetAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to register assets." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const id = String(fd.get("id") ?? "").trim()
  const name = String(fd.get("name") ?? "").trim()
  const category = String(fd.get("category") ?? "").trim()
  const condition = String(fd.get("condition") ?? "good").trim()
  const acquired_on = String(fd.get("acquired_on") ?? "").trim()
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!id || !name || !category) return { ok: false, message: "Asset id, name and category are required." }
  try {
    const r = await platformRegisterAsset({ id, org_unit, name, category, condition, acquired_on })
    revalidatePath("/estate-register")
    return { ok: r.ok, message: r.ok ? `Registered ${id} (${name}).` : r.error || "Registration rejected." }
  } catch (e) {
    logger.error("infra.register failed", { error: String(e) })
    return { ok: false, message: `Registration failed: ${String(e)}` }
  }
}

/** Raise a maintenance ticket against an asset. A critical ticket auto-flips the asset to under_maintenance. */
export async function raiseTicketAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to raise tickets." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const asset_id = String(fd.get("asset_id") ?? "").trim()
  const issue = String(fd.get("issue") ?? "").trim()
  const severity = String(fd.get("severity") ?? "medium").trim()
  if (!asset_id) return { ok: false, message: "Asset is required." }
  if (!issue) return { ok: false, message: "An issue description is required." }
  const id = `MTK-${asset_id}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformRaiseTicket({ id, asset_id, org_unit, issue, severity })
    revalidatePath("/estate-register")
    return { ok: r.ok, message: r.ok ? `Ticket ${id} raised (${severity}).` : r.error || "Ticket rejected." }
  } catch (e) {
    logger.error("infra.raise failed", { error: String(e) })
    return { ok: false, message: `Raise failed: ${String(e)}` }
  }
}

/** Advance a ticket: assign (to an assignee) | resolve (today) | close. */
export async function advanceTicketAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to act on tickets." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const action = String(fd.get("action") ?? "").trim() as "assign" | "resolve" | "close"
  const assignee = String(fd.get("assignee") ?? "").trim()
  if (!id || !["assign", "resolve", "close"].includes(action)) return { ok: false, message: "Ticket id and a valid action are required." }
  if (action === "assign" && !assignee) return { ok: false, message: "An assignee is required to assign a ticket." }
  try {
    const r = await platformAdvanceTicket(id, action, action === "assign" ? assignee : action === "resolve" ? "2026-06-22" : "")
    revalidatePath("/estate-register")
    return { ok: r.ok, message: r.ok ? `${action} → ${id}.` : r.error || "Action rejected." }
  } catch (e) {
    logger.error("infra.advance failed", { error: String(e) })
    return { ok: false, message: `Action failed: ${String(e)}` }
  }
}

/** Decommission an asset — rejected by the backbone while it carries an open ticket. */
export async function decommissionAssetAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to decommission assets." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Asset id is required." }
  try {
    const r = await platformDecommissionAsset(id)
    revalidatePath("/estate-register")
    return { ok: r.ok, message: r.ok ? `Decommissioned ${id}.` : r.error || "Decommission rejected (open ticket?)." }
  } catch (e) {
    logger.error("infra.decommission failed", { error: String(e) })
    return { ok: false, message: `Decommission failed: ${String(e)}` }
  }
}

/** Return an under-maintenance asset to service at a graded condition. */
export async function returnAssetAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to return assets." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const condition = String(fd.get("condition") ?? "fair").trim()
  if (!id) return { ok: false, message: "Asset id is required." }
  try {
    const r = await platformReturnAsset(id, condition)
    revalidatePath("/estate-register")
    return { ok: r.ok, message: r.ok ? `Returned ${id} to service (${condition}).` : r.error || "Return rejected (open ticket?)." }
  } catch (e) {
    logger.error("infra.return failed", { error: String(e) })
    return { ok: false, message: `Return failed: ${String(e)}` }
  }
}
