"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { addSyllabusSubject, setSyllabusPct, listSyllabus, type NewSyllabus, type SyllabusRecord } from "@/lib/syllabus/store"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listSyllabusAction(udiseCode?: string): Promise<SyllabusRecord[]> {
  noStore()
  try {
    return await listSyllabus(udiseCode)
  } catch (e) {
    logger.error("syllabus.list failed", { error: String(e) })
    return []
  }
}

export async function addSyllabusSubjectAction(input: NewSyllabus): Promise<{ ok: boolean; record?: SyllabusRecord; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage syllabus tracking." }
  try {
    const record = await addSyllabusSubject(input)
    revalidatePath("/(dashboards)/principal/dashboard")
    return { ok: true, record }
  } catch (e) {
    logger.error("syllabus.add failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function setSyllabusPctAction(id: string, pct: number): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to update syllabus tracking." }
  try {
    const ok = await setSyllabusPct(id, pct)
    revalidatePath("/(dashboards)/principal/dashboard")
    return { ok }
  } catch (e) {
    logger.error("syllabus.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
