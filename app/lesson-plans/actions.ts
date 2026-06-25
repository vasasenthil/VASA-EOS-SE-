"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listLessonPlans, getLessonPlan, createLessonPlan, updateLessonPlan, deleteLessonPlan, seedLessonPlans } from "@/lib/lessonplans/store"
import { queryLessonPlans, validateLessonPlan, type LessonPlan, type LessonPlanInput, type LessonPlanFilters, type LessonPlanPage } from "@/lib/lessonplans"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listLessonPlansAction(filters: LessonPlanFilters = {}): Promise<LessonPlanPage> {
  noStore()
  try {
    return queryLessonPlans(await listLessonPlans(), filters)
  } catch (e) {
    logger.error("lessonplans.list failed", { error: String(e) })
    return { plans: [], total: 0, totalPages: 1, page: 1, pageSize: 9 }
  }
}

export async function getLessonPlanAction(id: string): Promise<LessonPlan | null> {
  noStore()
  try {
    return (await getLessonPlan(id)) ?? null
  } catch (e) {
    logger.error("lessonplans.get failed", { error: String(e) })
    return null
  }
}

export async function createLessonPlanAction(input: LessonPlanInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage lesson plans." }
  const v = validateLessonPlan(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const p = await createLessonPlan(input)
    revalidatePath("/lesson-plans")
    return { ok: true, id: p.id }
  } catch (e) {
    logger.error("lessonplans.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateLessonPlanAction(id: string, input: LessonPlanInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage lesson plans." }
  const v = validateLessonPlan(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateLessonPlan(id, input)
    if (!updated) return { ok: false, reason: "Lesson plan not found." }
    revalidatePath("/lesson-plans")
    revalidatePath(`/lesson-plans/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("lessonplans.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteLessonPlanAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage lesson plans." }
  try {
    const ok = await deleteLessonPlan(id)
    revalidatePath("/lesson-plans")
    return { ok }
  } catch (e) {
    logger.error("lessonplans.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedLessonPlansAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed lesson plans." }
  try {
    const count = await seedLessonPlans()
    revalidatePath("/lesson-plans")
    return { ok: true, count }
  } catch (e) {
    logger.error("lessonplans.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
