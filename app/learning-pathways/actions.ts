"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listPathways, getPathway, createPathway, updatePathway, deletePathway, seedPathways } from "@/lib/pathways/store"
import { queryPathways, validatePathway, type Pathway, type PathwayInput, type PathwayFilters, type PathwayPage } from "@/lib/pathways"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listPathwaysAction(filters: PathwayFilters = {}): Promise<PathwayPage> {
  noStore()
  try {
    return queryPathways(await listPathways(), filters)
  } catch (e) {
    logger.error("pathways.list failed", { error: String(e) })
    return { pathways: [], total: 0, totalPages: 1, page: 1, pageSize: 9, summary: { total: 0, withReadyStep: 0, active: 0, completed: 0 } }
  }
}

export async function getPathwayAction(id: string): Promise<Pathway | null> {
  noStore()
  try {
    return (await getPathway(id)) ?? null
  } catch (e) {
    logger.error("pathways.get failed", { error: String(e) })
    return null
  }
}

export async function createPathwayAction(input: PathwayInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage learning pathways." }
  const v = validatePathway(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const p = await createPathway(input)
    revalidatePath("/learning-pathways")
    return { ok: true, id: p.id }
  } catch (e) {
    logger.error("pathways.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updatePathwayAction(id: string, input: PathwayInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage learning pathways." }
  const v = validatePathway(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updatePathway(id, input)
    if (!updated) return { ok: false, reason: "Pathway not found." }
    revalidatePath("/learning-pathways")
    revalidatePath(`/learning-pathways/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("pathways.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deletePathwayAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage learning pathways." }
  try {
    const ok = await deletePathway(id)
    revalidatePath("/learning-pathways")
    return { ok }
  } catch (e) {
    logger.error("pathways.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedPathwaysAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed learning pathways." }
  try {
    const count = await seedPathways()
    revalidatePath("/learning-pathways")
    return { ok: true, count }
  } catch (e) {
    logger.error("pathways.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
