"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformCalendarDashboard,
  platformCalendarEntries,
  platformAddCalendarEntry,
  platformDecideCalendarEntry,
  type PlatformCalendarDashboard,
  type PlatformCalendarEntry,
} from "@/lib/platform-client"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

const SCOPE = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"
const ORG = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"

const TYPES = ["term", "exam", "holiday", "ptm", "event"]

export interface ActionResult {
  ok: boolean
  message: string
}

export async function backboneConnected(): Promise<boolean> {
  return platformReachable()
}

export async function getCalendarDashboard(): Promise<PlatformCalendarDashboard | null> {
  try {
    return await platformCalendarDashboard(SCOPE, "DEO", "2026-06-15")
  } catch (e) {
    logger.error("calendar.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getPendingEntries(): Promise<PlatformCalendarEntry[]> {
  try {
    const all = await platformCalendarEntries(SCOPE, "", "")
    return all.filter((e) => e.status === "pending")
  } catch (e) {
    logger.error("calendar.pending failed", { error: String(e) })
    return []
  }
}

/** Add a calendar draft and route it into its dynamic, type+tenancy-sized approval chain. */
export async function addEntryAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:school"))) return { ok: false, message: "You do not have permission to add calendar entries." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim() || ORG
  const title = String(fd.get("title") ?? "").trim()
  const type = String(fd.get("type") ?? "").trim()
  const start_date = String(fd.get("start_date") ?? "").trim()
  const end_date = String(fd.get("end_date") ?? "").trim() || start_date
  if (!title) return { ok: false, message: "A title is required." }
  if (!TYPES.includes(type)) return { ok: false, message: "A valid type is required." }
  if (!start_date) return { ok: false, message: "A start date is required." }
  const id = `CAL-${type.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformAddCalendarEntry({ id, title, type, start_date, end_date, org_unit }, true)
    revalidatePath("/events-calendar")
    if (!r.ok) return { ok: false, message: r.error || "Entry rejected." }
    const e = r.entry!
    return {
      ok: true,
      message: e.status === "approved"
        ? `${title}: auto-published (within local authority — no approval needed).`
        : `${title}: submitted → ${(e.approval_chain ?? []).map((s) => s.tier).join(" → ")} (${e.approval_chain?.length ?? 0}-level approval).`,
    }
  } catch (e) {
    logger.error("calendar.add failed", { error: String(e) })
    return { ok: false, message: `Add failed: ${String(e)}` }
  }
}

/** Decide at an entry's CURRENT approval level. role + required scope are carried from that step (fail-closed). */
export async function decideEntryAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:governance"))) return { ok: false, message: "You do not have permission to approve calendar entries." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const entry_id = String(fd.get("entry_id") ?? "").trim()
  const role = String(fd.get("role") ?? "").trim()
  const scope = String(fd.get("scope") ?? "").trim()
  const note = String(fd.get("note") ?? "").trim()
  const approve = String(fd.get("approve") ?? "") === "true"
  if (!entry_id || !role) return { ok: false, message: "Entry id and approver role are required." }
  try {
    const r = await platformDecideCalendarEntry({
      entry_id, approve, actor: "web-console", role,
      scopes: scope ? [scope] : [], note,
    })
    revalidatePath("/events-calendar")
    if (!r.ok) return { ok: false, message: r.error || "Decision rejected." }
    const e = r.entry!
    return {
      ok: true,
      message: !approve
        ? `Rejected ${entry_id} at ${role}.`
        : e.status === "approved"
          ? `Approved ${entry_id} — fully approved and published.`
          : `Approved ${entry_id} at ${role} → advanced to the next tier.`,
    }
  } catch (e) {
    logger.error("calendar.decide failed", { error: String(e) })
    return { ok: false, message: `Decision failed: ${String(e)}` }
  }
}
