"use server"

import { revalidatePath } from "next/cache"
import {
  platformConfigured,
  platformAttendanceDashboard,
  platformStudentAttendance,
  platformMarkAttendance,
  type PlatformAttendanceDashboard,
  type PlatformStudentAttendance,
} from "@/lib/platform-client"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

const SCOPE = process.env.PLATFORM_DEFAULT_ORG ?? "TN-DIST-Chennai"
const DEFAULT_DATE = "2026-06-10"

const STATUSES = ["present", "absent", "late", "excused"]
const SOURCES = ["manual", "biometric", "rfid"]

export interface ActionResult {
  ok: boolean
  message: string
}

export async function backboneConnected(): Promise<boolean> {
  return platformConfigured()
}

export async function getAttendanceDashboard(date: string = DEFAULT_DATE): Promise<PlatformAttendanceDashboard | null> {
  try {
    return await platformAttendanceDashboard(SCOPE, date || DEFAULT_DATE)
  } catch (e) {
    logger.error("attendance.dashboard failed", { error: String(e) })
    return null
  }
}

export async function getStudentAttendance(student: string): Promise<PlatformStudentAttendance | null> {
  try {
    return await platformStudentAttendance(student)
  } catch (e) {
    logger.error("attendance.student failed", { error: String(e) })
    return null
  }
}

/** Mark (or correct) a student's attendance for a date. Re-marking the same day upserts, never duplicates. */
export async function markAttendanceAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  if (!(await canDo("manage:students"))) return { ok: false, message: "You do not have permission to mark attendance." }
  if (!platformConfigured()) return { ok: false, message: "Backbone not connected — set PLATFORM_URL to run the durable stack." }
  const org_unit = String(fd.get("org_unit") ?? "").trim()
  const student_id = String(fd.get("student_id") ?? "").trim()
  const date = String(fd.get("date") ?? "").trim()
  const status = String(fd.get("status") ?? "").trim()
  const source = String(fd.get("source") ?? "manual").trim()
  if (!org_unit) return { ok: false, message: "School (org unit) is required." }
  if (!student_id) return { ok: false, message: "A student id is required." }
  if (!date) return { ok: false, message: "A date is required." }
  if (!STATUSES.includes(status)) return { ok: false, message: "A valid status is required." }
  try {
    const r = await platformMarkAttendance({
      student_id, org_unit, date, status,
      source: SOURCES.includes(source) ? source : "manual",
      marked_by: "web-console",
    })
    revalidatePath("/student-attendance")
    return { ok: r.ok, message: r.ok ? `Marked ${student_id} ${status} on ${date}.` : r.error || "Mark rejected." }
  } catch (e) {
    logger.error("attendance.mark failed", { error: String(e) })
    return { ok: false, message: `Mark failed: ${String(e)}` }
  }
}
