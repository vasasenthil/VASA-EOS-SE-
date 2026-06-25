"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { saveSheet, listSheets, type NewSheet, type SavedSheet } from "@/lib/staff-attendance/store"
import { recordTeacherPresence, latestTeacherPresence, type NewTeacherPresence, type TeacherPresenceRecord } from "@/lib/staff-attendance/presence-store"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listSheetsAction(): Promise<SavedSheet[]> {
  noStore()
  try {
    // Per-role data scoping: staff-attendance sheets roll up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listSheets())
  } catch (e) {
    logger.error("staff-attendance.list failed", { error: String(e) })
    return []
  }
}

export async function saveSheetAction(input: NewSheet): Promise<SavedSheet | null> {
  try {
    const s = await saveSheet(input)
    revalidatePath("/staff-attendance")
    return s
  } catch (e) {
    logger.error("staff-attendance.save failed", { error: String(e) })
    return null
  }
}

export async function latestTeacherPresenceAction(udiseCode?: string): Promise<TeacherPresenceRecord | null> {
  noStore()
  try {
    return (await latestTeacherPresence(udiseCode)) ?? null
  } catch (e) {
    logger.error("teacher-presence.latest failed", { error: String(e) })
    return null
  }
}

export async function recordTeacherPresenceAction(input: NewTeacherPresence): Promise<{ ok: boolean; record?: TeacherPresenceRecord; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to record teacher presence." }
  try {
    const record = await recordTeacherPresence(input)
    revalidatePath("/(dashboards)/principal/dashboard")
    return { ok: true, record }
  } catch (e) {
    logger.error("teacher-presence.record failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
