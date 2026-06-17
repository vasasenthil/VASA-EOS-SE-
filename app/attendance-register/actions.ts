"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listAttendance, getAttendance, createAttendance, updateAttendance, deleteAttendance, seedAttendance } from "@/lib/attendance-register/store"
import { queryAttendance, validateAttendance, type AttendanceEntry, type AttendanceInput, type AttendanceFilters, type AttendancePage } from "@/lib/attendance-register"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listAttendanceAction(filters: AttendanceFilters = {}): Promise<AttendancePage> {
  noStore()
  try {
    return queryAttendance(await listAttendance(), filters)
  } catch (e) {
    logger.error("attendance.list failed", { error: String(e) })
    return { entries: [], total: 0, totalPages: 1, page: 1, pageSize: 10, rate: { total: 0, attended: 0, pct: 0 } }
  }
}

export async function getAttendanceAction(id: string): Promise<AttendanceEntry | null> {
  noStore()
  try {
    return (await getAttendance(id)) ?? null
  } catch (e) {
    logger.error("attendance.get failed", { error: String(e) })
    return null
  }
}

export async function createAttendanceAction(input: AttendanceInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage attendance." }
  const v = validateAttendance(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const e = await createAttendance(input)
    revalidatePath("/attendance-register")
    return { ok: true, id: e.id }
  } catch (e) {
    logger.error("attendance.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateAttendanceAction(id: string, input: AttendanceInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage attendance." }
  const v = validateAttendance(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateAttendance(id, input)
    if (!updated) return { ok: false, reason: "Attendance entry not found." }
    revalidatePath("/attendance-register")
    revalidatePath(`/attendance-register/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("attendance.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteAttendanceAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage attendance." }
  try {
    const ok = await deleteAttendance(id)
    revalidatePath("/attendance-register")
    return { ok }
  } catch (e) {
    logger.error("attendance.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedAttendanceAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed attendance." }
  try {
    const count = await seedAttendance()
    revalidatePath("/attendance-register")
    return { ok: true, count }
  } catch (e) {
    logger.error("attendance.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
