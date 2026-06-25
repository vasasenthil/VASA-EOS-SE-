"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listStaff, getStaff, createStaff, updateStaff, deleteStaff, seedStaff } from "@/lib/staffmaster/store"
import { queryStaff, validateStaff, type StaffMember, type StaffInput, type StaffFilters, type StaffPage } from "@/lib/staffmaster"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listStaffAction(filters: StaffFilters = {}): Promise<StaffPage> {
  noStore()
  try {
    return queryStaff(await listStaff(), filters)
  } catch (e) {
    logger.error("staffmaster.list failed", { error: String(e) })
    return { staff: [], total: 0, totalPages: 1, page: 1, pageSize: 10, summary: { total: 0, active: 0, teaching: 0, nonTeaching: 0, onLeave: 0, retiringSoon: 0 } }
  }
}

export async function getStaffAction(id: string): Promise<StaffMember | null> {
  noStore()
  try {
    return (await getStaff(id)) ?? null
  } catch (e) {
    logger.error("staffmaster.get failed", { error: String(e) })
    return null
  }
}

export async function createStaffAction(input: StaffInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage staff records." }
  const v = validateStaff(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const s = await createStaff(input)
    revalidatePath("/staff-directory")
    return { ok: true, id: s.id }
  } catch (e) {
    logger.error("staffmaster.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateStaffAction(id: string, input: StaffInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage staff records." }
  const v = validateStaff(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateStaff(id, input)
    if (!updated) return { ok: false, reason: "Staff member not found." }
    revalidatePath("/staff-directory")
    revalidatePath(`/staff-directory/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("staffmaster.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteStaffAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage staff records." }
  try {
    const ok = await deleteStaff(id)
    revalidatePath("/staff-directory")
    return { ok }
  } catch (e) {
    logger.error("staffmaster.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedStaffAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed staff records." }
  try {
    const count = await seedStaff()
    revalidatePath("/staff-directory")
    return { ok: true, count }
  } catch (e) {
    logger.error("staffmaster.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
