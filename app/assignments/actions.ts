"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listAssignments, getAssignment, createAssignment, updateAssignment, deleteAssignment, seedAssignments } from "@/lib/assignments/store"
import { queryAssignments, validateAssignment, type Assignment, type AssignmentInput, type AssignmentFilters, type AssignmentPage } from "@/lib/assignments"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listAssignmentsAction(filters: AssignmentFilters = {}): Promise<AssignmentPage> {
  noStore()
  try {
    return queryAssignments(await listAssignments(), filters)
  } catch (e) {
    logger.error("assignments.list failed", { error: String(e) })
    return { assignments: [], total: 0, totalPages: 1, page: 1, pageSize: 9 }
  }
}

export async function getAssignmentAction(id: string): Promise<Assignment | null> {
  noStore()
  try {
    return (await getAssignment(id)) ?? null
  } catch (e) {
    logger.error("assignments.get failed", { error: String(e) })
    return null
  }
}

export async function createAssignmentAction(input: AssignmentInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage assignments." }
  const v = validateAssignment(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const a = await createAssignment(input)
    revalidatePath("/assignments")
    return { ok: true, id: a.id }
  } catch (e) {
    logger.error("assignments.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateAssignmentAction(id: string, input: AssignmentInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage assignments." }
  const v = validateAssignment(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateAssignment(id, input)
    if (!updated) return { ok: false, reason: "Assignment not found." }
    revalidatePath("/assignments")
    revalidatePath(`/assignments/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("assignments.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteAssignmentAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage assignments." }
  try {
    const ok = await deleteAssignment(id)
    revalidatePath("/assignments")
    return { ok }
  } catch (e) {
    logger.error("assignments.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedAssignmentsAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed assignments." }
  try {
    const count = await seedAssignments()
    revalidatePath("/assignments")
    return { ok: true, count }
  } catch (e) {
    logger.error("assignments.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
