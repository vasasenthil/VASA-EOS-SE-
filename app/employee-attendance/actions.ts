"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformReachable,
  platformStaffAttendanceDashboard,
  platformStaffAttendanceProfile,
  platformMarkStaffAttendance,
  type PlatformStaffAttendanceDashboard,
  type PlatformStaffMonthly,
} from "@/lib/platform-client"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

const SCOPE = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"
const DEFAULT_DATE = "2026-06-01"
const STATUSES = ["present", "absent", "half_day", "leave", "on_duty"]

export interface ActionResult {
  ok: boolean
  message: string
}

export async function backboneConnected(): Promise<boolean> {
  return platformReachable()
}

export async function getStaffDashboard(date: string = DEFAULT_DATE): Promise<PlatformStaffAttendanceDashboard | null> {
  try {
    return await platformStaffAttendanceDashboard(SCOPE, date || DEFAULT_DATE)
  } catch (e) {
    logger.error("staffatt.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getStaffProfile(employee: string): Promise<PlatformStaffMonthly | null> {
  try {
    return await platformStaffAttendanceProfile(employee)
  } catch (e) {
    logger.error("staffatt.profile failed", { error: String(e) })
    return null
  }
}

/** Mark (or correct) an employee's attendance for a date. Re-marking the same day upserts, never duplicates. */
export async function markStaffAttendanceAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:staff"))) return { ok: false, message: "You do not have permission to mark staff attendance." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const employee_id = String(fd.get("employee_id") ?? "").trim()
  const date = String(fd.get("date") ?? "").trim()
  const status = String(fd.get("status") ?? "").trim()
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!employee_id) return { ok: false, message: "An employee id is required." }
  if (!date) return { ok: false, message: "A date is required." }
  if (!STATUSES.includes(status)) return { ok: false, message: "A valid status is required." }
  try {
    const r = await platformMarkStaffAttendance({ employee_id, org_unit, date, status, marked_by: "web-console" })
    revalidatePath("/employee-attendance")
    return { ok: r.ok, message: r.ok ? `Marked ${employee_id} ${status} on ${date}.` : r.error || "Mark rejected." }
  } catch (e) {
    logger.error("staffatt.mark failed", { error: String(e) })
    return { ok: false, message: `Mark failed: ${String(e)}` }
  }
}
