"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listHealth, getHealth, createHealth, updateHealth, deleteHealth, seedHealth } from "@/lib/healthregister/store"
import { queryHealth, validateHealth, type HealthRecord, type HealthInput, type HealthFilters, type HealthPage } from "@/lib/healthregister"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listHealthAction(filters: HealthFilters = {}): Promise<HealthPage> {
  noStore()
  try {
    return queryHealth(await listHealth(), filters)
  } catch (e) {
    logger.error("health.list failed", { error: String(e) })
    return { records: [], total: 0, totalPages: 1, page: 1, pageSize: 10, summary: { total: 0, underweight: 0, overweight: 0, anaemia: 0, referrals: 0 } }
  }
}

export async function getHealthAction(id: string): Promise<HealthRecord | null> {
  noStore()
  try {
    return (await getHealth(id)) ?? null
  } catch (e) {
    logger.error("health.get failed", { error: String(e) })
    return null
  }
}

export async function createHealthAction(input: HealthInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage health records." }
  const v = validateHealth(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const h = await createHealth(input)
    revalidatePath("/health-register")
    return { ok: true, id: h.id }
  } catch (e) {
    logger.error("health.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateHealthAction(id: string, input: HealthInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage health records." }
  const v = validateHealth(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateHealth(id, input)
    if (!updated) return { ok: false, reason: "Record not found." }
    revalidatePath("/health-register")
    revalidatePath(`/health-register/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("health.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteHealthAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage health records." }
  try {
    const ok = await deleteHealth(id)
    revalidatePath("/health-register")
    return { ok }
  } catch (e) {
    logger.error("health.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedHealthAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed health records." }
  try {
    const count = await seedHealth()
    revalidatePath("/health-register")
    return { ok: true, count }
  } catch (e) {
    logger.error("health.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
