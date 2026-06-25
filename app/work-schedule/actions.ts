"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listWorkTime, getWorkTime, createWorkTime, updateWorkTime, deleteWorkTime, seedWorkTime } from "@/lib/worktime/store"
import { queryWorkTime, validateWorkTime, monthWorkingDays, workingDaysInRange, type WorkTimeProfile, type WorkTimeInput, type WorkTimeFilters, type WorkTimePage, type SchoolDay, type RangeSummary } from "@/lib/worktime"
import { listHolidays } from "@/lib/holidays/store"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listWorkTimeAction(filters: WorkTimeFilters = {}): Promise<WorkTimePage> {
  noStore()
  try {
    return queryWorkTime(await listWorkTime(), filters)
  } catch (e) {
    logger.error("worktime.list failed", { error: String(e) })
    return { profiles: [], total: 0, totalPages: 1, page: 1, pageSize: 10 }
  }
}

export async function getWorkTimeAction(id: string): Promise<WorkTimeProfile | null> {
  noStore()
  try {
    return (await getWorkTime(id)) ?? null
  } catch (e) {
    logger.error("worktime.get failed", { error: String(e) })
    return null
  }
}

/**
 * Resolve a profile's school days for one month by JOINING the Holiday Calendar — the chain in
 * action: Working-Time + Holidays → working/holiday/weekly-off per date. Also returns the term
 * summary so the yearly working-time totals are visible.
 */
export async function resolveMonthAction(id: string, year: number, month: number): Promise<{ days: SchoolDay[]; termSummary: RangeSummary } | null> {
  noStore()
  try {
    const profile = await getWorkTime(id)
    if (!profile) return null
    const holidays = await listHolidays()
    return {
      days: monthWorkingDays(profile, holidays, year, month),
      termSummary: workingDaysInRange(profile, holidays, profile.termStart, profile.termEnd),
    }
  } catch (e) {
    logger.error("worktime.resolveMonth failed", { error: String(e) })
    return null
  }
}

export async function createWorkTimeAction(input: WorkTimeInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage working-time profiles." }
  const v = validateWorkTime(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const p = await createWorkTime(input)
    revalidatePath("/work-schedule")
    return { ok: true, id: p.id }
  } catch (e) {
    logger.error("worktime.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateWorkTimeAction(id: string, input: WorkTimeInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage working-time profiles." }
  const v = validateWorkTime(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateWorkTime(id, input)
    if (!updated) return { ok: false, reason: "Working-time profile not found." }
    revalidatePath("/work-schedule")
    revalidatePath(`/work-schedule/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("worktime.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteWorkTimeAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage working-time profiles." }
  try {
    const ok = await deleteWorkTime(id)
    revalidatePath("/work-schedule")
    return { ok }
  } catch (e) {
    logger.error("worktime.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedWorkTimeAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed working-time profiles." }
  try {
    const count = await seedWorkTime()
    revalidatePath("/work-schedule")
    return { ok: true, count }
  } catch (e) {
    logger.error("worktime.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
