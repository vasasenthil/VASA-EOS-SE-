"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listTimetable, getTimetableEntry, createTimetableEntry, updateTimetableEntry, deleteTimetableEntry, seedTimetable } from "@/lib/timetable-manager/store"
import { queryTimetable, validateTimetable, findClashes, describeClash, type TimetableEntry, type TimetableInput, type TimetableFilters, type TimetablePage } from "@/lib/timetable-manager"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listTimetableAction(filters: TimetableFilters = {}): Promise<TimetablePage> {
  noStore()
  try {
    return queryTimetable(await listTimetable(), filters)
  } catch (e) {
    logger.error("timetable.list failed", { error: String(e) })
    return { entries: [], total: 0, totalPages: 1, page: 1, pageSize: 12 }
  }
}

export async function getTimetableEntryAction(id: string): Promise<TimetableEntry | null> {
  noStore()
  try {
    return (await getTimetableEntry(id)) ?? null
  } catch (e) {
    logger.error("timetable.get failed", { error: String(e) })
    return null
  }
}

export async function createTimetableAction(input: TimetableInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage the timetable." }
  const v = validateTimetable(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const clashes = findClashes(await listTimetable(), input)
    if (clashes.length > 0) return { ok: false, reason: describeClash(clashes[0], input) }
    const e = await createTimetableEntry(input)
    revalidatePath("/timetable-manager")
    return { ok: true, id: e.id }
  } catch (e) {
    logger.error("timetable.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateTimetableAction(id: string, input: TimetableInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage the timetable." }
  const v = validateTimetable(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const clashes = findClashes(await listTimetable(), input, id)
    if (clashes.length > 0) return { ok: false, reason: describeClash(clashes[0], input) }
    const updated = await updateTimetableEntry(id, input)
    if (!updated) return { ok: false, reason: "Timetable entry not found." }
    revalidatePath("/timetable-manager")
    revalidatePath(`/timetable-manager/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("timetable.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteTimetableAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage the timetable." }
  try {
    const ok = await deleteTimetableEntry(id)
    revalidatePath("/timetable-manager")
    return { ok }
  } catch (e) {
    logger.error("timetable.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedTimetableAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed the timetable." }
  try {
    const count = await seedTimetable()
    revalidatePath("/timetable-manager")
    return { ok: true, count }
  } catch (e) {
    logger.error("timetable.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
