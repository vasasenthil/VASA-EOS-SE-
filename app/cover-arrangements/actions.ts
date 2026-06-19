"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listCovers, getCover, createCover, updateCover, deleteCover, seedCovers } from "@/lib/coverflow/store"
import { queryCovers, validateCover, freeFrom, weekday, type CoverArrangement, type CoverInput, type CoverFilters, type CoverPage } from "@/lib/coverflow"
import { listTimetable } from "@/lib/timetable-manager/store"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listCoversAction(filters: CoverFilters = {}): Promise<CoverPage> {
  noStore()
  try {
    return queryCovers(await listCovers(), filters)
  } catch (e) {
    logger.error("cover.list failed", { error: String(e) })
    return { covers: [], total: 0, totalPages: 1, page: 1, pageSize: 10, summary: { total: 0, pending: 0, assigned: 0, completed: 0 } }
  }
}

export async function getCoverAction(id: string): Promise<CoverArrangement | null> {
  noStore()
  try {
    return (await getCover(id)) ?? null
  } catch (e) {
    logger.error("cover.get failed", { error: String(e) })
    return null
  }
}

/**
 * Suggest teachers FREE in this date+period by reading the Timetable Manager: the roster is every
 * teacher who appears in the timetable; busy = those assigned to a class in this weekday+period.
 * Cross-module helper (cover ← timetable) so a head teacher fills gaps without double-booking.
 */
export async function suggestSubstitutesAction(date: string, period: number, excludeTeacher?: string): Promise<string[]> {
  noStore()
  try {
    const wd = weekday(date)
    if (!wd) return []
    const entries = await listTimetable()
    const roster = [...new Set(entries.map((e) => e.teacher).filter(Boolean))]
    const busy = entries.filter((e) => e.day === wd && e.period === period).map((e) => e.teacher)
    if (excludeTeacher) busy.push(excludeTeacher)
    return freeFrom(busy, roster)
  } catch (e) {
    logger.error("cover.suggest failed", { error: String(e) })
    return []
  }
}

export async function createCoverAction(input: CoverInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage cover arrangements." }
  const v = validateCover(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const c = await createCover(input)
    revalidatePath("/cover-arrangements")
    return { ok: true, id: c.id }
  } catch (e) {
    logger.error("cover.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateCoverAction(id: string, input: CoverInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage cover arrangements." }
  const v = validateCover(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateCover(id, input)
    if (!updated) return { ok: false, reason: "Cover not found." }
    revalidatePath("/cover-arrangements")
    revalidatePath(`/cover-arrangements/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("cover.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteCoverAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage cover arrangements." }
  try {
    const ok = await deleteCover(id)
    revalidatePath("/cover-arrangements")
    return { ok }
  } catch (e) {
    logger.error("cover.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedCoversAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed cover arrangements." }
  try {
    const count = await seedCovers()
    revalidatePath("/cover-arrangements")
    return { ok: true, count }
  } catch (e) {
    logger.error("cover.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
