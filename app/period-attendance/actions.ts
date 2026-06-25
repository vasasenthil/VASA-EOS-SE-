"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformPeriodDashboard,
  platformPeriodSheet,
  platformMarkPeriod,
  type PlatformPeriodDashboard,
  type PlatformPeriodAttendance,
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

export async function getPeriodDashboard(): Promise<PlatformPeriodDashboard | null> {
  try {
    return await platformPeriodDashboard(SCOPE)
  } catch (e) {
    logger.error("period.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getPeriodSheet(cls: string, date: string): Promise<PlatformPeriodAttendance[]> {
  try {
    return await platformPeriodSheet(SCOPE, cls, date)
  } catch (e) {
    logger.error("period.sheet failed", { error: String(e) })
    return []
  }
}

/** Mark a class-period — validated against the timetable slot + (if delivered) a published lesson plan. */
export async function markPeriodAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:students"))) return { ok: false, message: "You do not have permission to mark period attendance." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const cls = String(fd.get("class") ?? "").trim()
  const date = String(fd.get("date") ?? "").trim()
  const period = Number.parseInt(String(fd.get("period") ?? ""), 10)
  const status = String(fd.get("status") ?? "delivered").trim()
  const strength = Number.parseInt(String(fd.get("strength") ?? "0"), 10)
  const lesson_plan_id = String(fd.get("lesson_plan_id") ?? "").trim()
  const absentees = String(fd.get("absentees") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!cls) return { ok: false, message: "A class is required." }
  if (!date) return { ok: false, message: "A date is required." }
  if (!Number.isFinite(period) || period < 1) return { ok: false, message: "A valid period number is required." }
  if (!Number.isFinite(strength) || strength < 0) return { ok: false, message: "Strength must be a non-negative number." }
  try {
    const r = await platformMarkPeriod({ org_unit, class: cls, date, period, status, strength, absentees, lesson_plan_id: lesson_plan_id || undefined })
    revalidatePath("/period-attendance")
    if (!r.ok) return { ok: false, message: r.error || "Mark rejected." }
    const rec = r.record!
    return {
      ok: true,
      message: rec.status === "not_held"
        ? `Period ${period} marked not held (${rec.subject}).`
        : `Marked ${rec.subject} P${period}: ${rec.present_count}/${rec.strength} present${rec.lesson_plan_id ? ` · plan ${rec.lesson_plan_id}` : ""}.`,
    }
  } catch (e) {
    logger.error("period.mark failed", { error: String(e) })
    return { ok: false, message: `Mark failed: ${String(e)}` }
  }
}
