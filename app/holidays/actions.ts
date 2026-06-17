"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listHolidays, getHoliday, createHoliday, updateHoliday, deleteHoliday, seedHolidays } from "@/lib/holidays/store"
import { queryHolidays, validateHoliday, type Holiday, type HolidayInput, type HolidayFilters, type HolidayPage } from "@/lib/holidays"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listHolidaysAction(filters: HolidayFilters = {}): Promise<HolidayPage> {
  noStore()
  try {
    return queryHolidays(await listHolidays(), filters)
  } catch (e) {
    logger.error("holidays.list failed", { error: String(e) })
    return { holidays: [], total: 0, totalPages: 1, page: 1, pageSize: 10, totalDays: 0 }
  }
}

export async function getHolidayAction(id: string): Promise<Holiday | null> {
  noStore()
  try {
    return (await getHoliday(id)) ?? null
  } catch (e) {
    logger.error("holidays.get failed", { error: String(e) })
    return null
  }
}

export async function createHolidayAction(input: HolidayInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage holidays." }
  const v = validateHoliday(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const h = await createHoliday(input)
    revalidatePath("/holidays")
    return { ok: true, id: h.id }
  } catch (e) {
    logger.error("holidays.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateHolidayAction(id: string, input: HolidayInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage holidays." }
  const v = validateHoliday(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateHoliday(id, input)
    if (!updated) return { ok: false, reason: "Holiday not found." }
    revalidatePath("/holidays")
    revalidatePath(`/holidays/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("holidays.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteHolidayAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage holidays." }
  try {
    const ok = await deleteHoliday(id)
    revalidatePath("/holidays")
    return { ok }
  } catch (e) {
    logger.error("holidays.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedHolidaysAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed holidays." }
  try {
    const count = await seedHolidays()
    revalidatePath("/holidays")
    return { ok: true, count }
  } catch (e) {
    logger.error("holidays.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
