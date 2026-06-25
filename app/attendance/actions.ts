"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import {
  recordClassAttendance,
  listClassAttendance,
  type NewClassAttendance,
  type ClassAttendanceRecord,
} from "@/lib/attendance/store"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listClassAttendanceAction(udiseCode?: string): Promise<ClassAttendanceRecord[]> {
  noStore()
  try {
    return await listClassAttendance(udiseCode)
  } catch (e) {
    logger.error("attendance.list failed", { error: String(e) })
    return []
  }
}

export async function recordClassAttendanceAction(input: NewClassAttendance): Promise<{ ok: boolean; record?: ClassAttendanceRecord; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to record attendance." }
  try {
    const record = await recordClassAttendance(input)
    revalidatePath("/(dashboards)/principal/dashboard")
    return { ok: true, record }
  } catch (e) {
    logger.error("attendance.record failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
