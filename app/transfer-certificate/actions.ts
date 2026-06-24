"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformTCDashboard,
  platformRequestTC,
  platformIssueTC,
  platformCancelTC,
  type PlatformTCDashboard,
} from "@/lib/platform-client"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

const SCOPE = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"
const REASONS = ["transfer", "completion", "migration", "withdrawal"]

export interface ActionResult {
  ok: boolean
  message: string
}

export async function backboneConnected(): Promise<boolean> {
  return platformConfigured()
}

export async function getTCDashboard(): Promise<PlatformTCDashboard | null> {
  try {
    return await platformTCDashboard(SCOPE)
  } catch (e) {
    logger.error("tc.dashboard failed", { error: String(e) })
    return null
  }
}

/** Raise a TC for a leaving student. A second active TC for the same student at the school is rejected. */
export async function requestTCAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:students"))) return { ok: false, message: "You do not have permission to raise TCs." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const student_id = String(fd.get("student_id") ?? "").trim()
  const reason = String(fd.get("reason") ?? "").trim()
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!student_id) return { ok: false, message: "A student id is required." }
  if (!REASONS.includes(reason)) return { ok: false, message: "A valid reason is required." }
  const id = `TC-${org_unit}-${student_id}-${Date.now().toString(36).toUpperCase()}`
  try {
    const r = await platformRequestTC({ id, org_unit, student_id, reason })
    revalidatePath("/transfer-certificate")
    return { ok: r.ok, message: r.ok ? `Raised TC for ${student_id} (${reason}).` : r.error || "Request rejected." }
  } catch (e) {
    logger.error("tc.request failed", { error: String(e) })
    return { ok: false, message: `Request failed: ${String(e)}` }
  }
}

/** Issue a requested TC with a serial number, or cancel an active TC. */
export async function advanceTCAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:students"))) return { ok: false, message: "You do not have permission to act on TCs." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected." }
  const id = String(fd.get("id") ?? "").trim()
  const action = String(fd.get("action") ?? "").trim()
  const serial = String(fd.get("serial") ?? "").trim()
  const note = String(fd.get("note") ?? "").trim()
  if (!id) return { ok: false, message: "TC id is required." }
  try {
    let r
    if (action === "issue") {
      if (!serial) return { ok: false, message: "A serial number is required to issue." }
      r = await platformIssueTC(id, serial, "2026-06-22")
    } else if (action === "cancel") {
      r = await platformCancelTC(id, note || "cancelled")
    } else {
      return { ok: false, message: "Invalid action." }
    }
    revalidatePath("/transfer-certificate")
    return { ok: r.ok, message: r.ok ? `${action} → ${id}.` : r.error || "Action rejected." }
  } catch (e) {
    logger.error("tc.advance failed", { error: String(e) })
    return { ok: false, message: `Action failed: ${String(e)}` }
  }
}
