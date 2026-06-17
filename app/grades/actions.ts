"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listGrades, getGrade, createGrade, updateGrade, deleteGrade, seedGrades } from "@/lib/grades/store"
import { queryGrades, validateGrade, type Grade, type GradeInput, type GradeFilters, type GradePage } from "@/lib/grades"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listGradesAction(filters: GradeFilters = {}): Promise<GradePage> {
  noStore()
  try {
    return queryGrades(await listGrades(), filters)
  } catch (e) {
    logger.error("grades.list failed", { error: String(e) })
    return { grades: [], total: 0, totalPages: 1, page: 1, pageSize: 10 }
  }
}

export async function getGradeAction(id: string): Promise<Grade | null> {
  noStore()
  try {
    return (await getGrade(id)) ?? null
  } catch (e) {
    logger.error("grades.get failed", { error: String(e) })
    return null
  }
}

export async function createGradeAction(input: GradeInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage grades." }
  const v = validateGrade(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const g = await createGrade(input)
    revalidatePath("/grades")
    return { ok: true, id: g.id }
  } catch (e) {
    logger.error("grades.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateGradeAction(id: string, input: GradeInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage grades." }
  const v = validateGrade(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateGrade(id, input)
    if (!updated) return { ok: false, reason: "Grade not found." }
    revalidatePath("/grades")
    revalidatePath(`/grades/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("grades.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteGradeAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage grades." }
  try {
    const ok = await deleteGrade(id)
    revalidatePath("/grades")
    return { ok }
  } catch (e) {
    logger.error("grades.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedGradesAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed grades." }
  try {
    const count = await seedGrades()
    revalidatePath("/grades")
    return { ok: true, count }
  } catch (e) {
    logger.error("grades.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
