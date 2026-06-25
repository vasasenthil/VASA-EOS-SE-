"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformSMCDashboard,
  platformScopedSMCMeetings,
  platformScheduleSMCMeeting,
  platformConveneSMCMeeting,
  platformPassSMCResolution,
  platformCompleteSMCResolution,
  platformCloseSMCMeeting,
  type PlatformSMCDashboard,
  type PlatformSMCMeeting,
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

export async function getSMCDashboard(): Promise<PlatformSMCDashboard | null> {
  try {
    return await platformSMCDashboard(SCOPE)
  } catch (e) {
    logger.error("smc.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getSMCMeetings(status = ""): Promise<PlatformSMCMeeting[]> {
  try {
    return await platformScopedSMCMeetings(SCOPE, status)
  } catch (e) {
    logger.error("smc.list failed", { error: String(e) })
    return []
  }
}

/** Schedule/constitute an SMC meeting — rejected unless ≥75% of members are parents (RTE §21(2)). */
export async function scheduleSMCAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to schedule SMC meetings." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const title = String(fd.get("title") ?? "").trim()
  const scheduled_date = String(fd.get("scheduled_date") ?? "").trim()
  const total_members = Number.parseInt(String(fd.get("total_members") ?? "0"), 10)
  const parent_members = Number.parseInt(String(fd.get("parent_members") ?? "0"), 10)
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!title) return { ok: false, message: "A title is required." }
  if (!scheduled_date) return { ok: false, message: "A scheduled date is required." }
  if (!Number.isFinite(total_members) || total_members < 1) return { ok: false, message: "Total members must be at least 1." }
  if (!Number.isFinite(parent_members) || parent_members < 0) return { ok: false, message: "Parent members must be non-negative." }
  const id = `SMC-${org_unit}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformScheduleSMCMeeting({ id, org_unit, title, scheduled_date, total_members, parent_members })
    revalidatePath("/smc-meetings")
    return { ok: r.ok, message: r.ok ? `Scheduled "${title}" (${parent_members}/${total_members} parents).` : r.error || "Schedule rejected." }
  } catch (e) {
    logger.error("smc.schedule failed", { error: String(e) })
    return { ok: false, message: `Schedule failed: ${String(e)}` }
  }
}

/** Convene a scheduled meeting with attendance — rejected if the majority quorum isn't met. */
export async function conveneSMCAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to convene SMC meetings." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const present_count = Number.parseInt(String(fd.get("present_count") ?? "0"), 10)
  if (!id) return { ok: false, message: "Meeting id is required." }
  if (!Number.isFinite(present_count) || present_count < 0) return { ok: false, message: "Present count must be non-negative." }
  try {
    const r = await platformConveneSMCMeeting(id, present_count)
    revalidatePath("/smc-meetings")
    return { ok: r.ok, message: r.ok ? `Convened ${id} — ${r.meeting?.present_count}/${r.meeting?.total_members} present (quorate).` : r.error || "Convene rejected." }
  } catch (e) {
    logger.error("smc.convene failed", { error: String(e) })
    return { ok: false, message: `Convene failed: ${String(e)}` }
  }
}

/** Pass a resolution — only on a convened (quorate) meeting. */
export async function resolveSMCAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to record resolutions." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const subject = String(fd.get("subject") ?? "").trim()
  const owner = String(fd.get("owner") ?? "").trim()
  const due_date = String(fd.get("due_date") ?? "").trim()
  if (!id) return { ok: false, message: "Meeting id is required." }
  if (!subject) return { ok: false, message: "A resolution subject is required." }
  try {
    const r = await platformPassSMCResolution({ id, subject, owner, due_date })
    revalidatePath("/smc-meetings")
    return { ok: r.ok, message: r.ok ? `Resolution passed on ${id}.` : r.error || "Resolution rejected." }
  } catch (e) {
    logger.error("smc.resolve failed", { error: String(e) })
    return { ok: false, message: `Resolution failed: ${String(e)}` }
  }
}

/** Mark an open resolution done. */
export async function completeSMCAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to update resolutions." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const resolution_id = String(fd.get("resolution_id") ?? "").trim()
  if (!id || !resolution_id) return { ok: false, message: "Meeting id and resolution id are required." }
  try {
    const r = await platformCompleteSMCResolution(id, resolution_id)
    revalidatePath("/smc-meetings")
    return { ok: r.ok, message: r.ok ? `Resolution ${resolution_id} completed.` : r.error || "Update rejected." }
  } catch (e) {
    logger.error("smc.complete failed", { error: String(e) })
    return { ok: false, message: `Update failed: ${String(e)}` }
  }
}

/** Close a convened meeting. */
export async function closeSMCAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to close SMC meetings." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  if (!id) return { ok: false, message: "Meeting id is required." }
  try {
    const r = await platformCloseSMCMeeting(id)
    revalidatePath("/smc-meetings")
    return { ok: r.ok, message: r.ok ? `Closed ${id}.` : r.error || "Close rejected." }
  } catch (e) {
    logger.error("smc.close failed", { error: String(e) })
    return { ok: false, message: `Close failed: ${String(e)}` }
  }
}
