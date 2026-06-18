"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listFees, getFee, createFee, updateFee, deleteFee, seedFees } from "@/lib/studentfees/store"
import { queryFees, validateFee, type FeeRecord, type FeeInput, type FeeFilters, type FeePage } from "@/lib/studentfees"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listFeesAction(filters: FeeFilters = {}): Promise<FeePage> {
  noStore()
  try {
    return queryFees(await listFees(), filters)
  } catch (e) {
    logger.error("studentfees.list failed", { error: String(e) })
    return { records: [], total: 0, totalPages: 1, page: 1, pageSize: 10, summary: { demand: 0, collected: 0, outstanding: 0, collectionRate: 0, defaulters: 0 } }
  }
}

export async function getFeeAction(id: string): Promise<FeeRecord | null> {
  noStore()
  try {
    return (await getFee(id)) ?? null
  } catch (e) {
    logger.error("studentfees.get failed", { error: String(e) })
    return null
  }
}

export async function createFeeAction(input: FeeInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage fees." }
  const v = validateFee(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const r = await createFee(input)
    revalidatePath("/student-fees")
    return { ok: true, id: r.id }
  } catch (e) {
    logger.error("studentfees.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateFeeAction(id: string, input: FeeInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage fees." }
  const v = validateFee(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateFee(id, input)
    if (!updated) return { ok: false, reason: "Fee record not found." }
    revalidatePath("/student-fees")
    revalidatePath(`/student-fees/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("studentfees.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteFeeAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage fees." }
  try {
    const ok = await deleteFee(id)
    revalidatePath("/student-fees")
    return { ok }
  } catch (e) {
    logger.error("studentfees.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedFeesAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed fees." }
  try {
    const count = await seedFees()
    revalidatePath("/student-fees")
    return { ok: true, count }
  } catch (e) {
    logger.error("studentfees.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
