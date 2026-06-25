"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listStudents, getStudent, createStudent, updateStudent, deleteStudent, seedStudents } from "@/lib/students/store"
import { queryStudents, validateStudent, type StudentRecord, type StudentInput, type StudentFilters, type StudentPage } from "@/lib/students"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listStudentsAction(filters: StudentFilters = {}): Promise<StudentPage> {
  noStore()
  try {
    return queryStudents(await listStudents(), filters)
  } catch (e) {
    logger.error("students.list failed", { error: String(e) })
    return { students: [], total: 0, totalPages: 1, page: 1, pageSize: 10 }
  }
}

export async function getStudentAction(id: string): Promise<StudentRecord | null> {
  noStore()
  try {
    return (await getStudent(id)) ?? null
  } catch (e) {
    logger.error("students.get failed", { error: String(e) })
    return null
  }
}

export async function createStudentAction(input: StudentInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage student records." }
  const v = validateStudent(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const s = await createStudent(input)
    revalidatePath("/students")
    return { ok: true, id: s.id }
  } catch (e) {
    logger.error("students.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateStudentAction(id: string, input: StudentInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage student records." }
  const v = validateStudent(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateStudent(id, input)
    if (!updated) return { ok: false, reason: "Student not found." }
    revalidatePath("/students")
    revalidatePath(`/students/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("students.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteStudentAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage student records." }
  try {
    const ok = await deleteStudent(id)
    revalidatePath("/students")
    return { ok }
  } catch (e) {
    logger.error("students.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedStudentsAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed student records." }
  try {
    const count = await seedStudents()
    revalidatePath("/students")
    return { ok: true, count }
  } catch (e) {
    logger.error("students.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
