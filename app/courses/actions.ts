"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listCourses, getCourse, createCourse, updateCourse, deleteCourse, seedCourses } from "@/lib/courses/store"
import { queryCourses, validateCourse, type Course, type CourseInput, type CourseFilters, type CoursePage } from "@/lib/courses"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listCoursesAction(filters: CourseFilters = {}): Promise<CoursePage> {
  noStore()
  try {
    return queryCourses(await listCourses(), filters)
  } catch (e) {
    logger.error("courses.list failed", { error: String(e) })
    return { courses: [], total: 0, totalPages: 1, page: 1, pageSize: 9 }
  }
}

export async function getCourseAction(id: string): Promise<Course | null> {
  noStore()
  try {
    return (await getCourse(id)) ?? null
  } catch (e) {
    logger.error("courses.get failed", { error: String(e) })
    return null
  }
}

export async function createCourseAction(input: CourseInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage courses." }
  const v = validateCourse(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const c = await createCourse(input)
    revalidatePath("/courses")
    return { ok: true, id: c.id }
  } catch (e) {
    logger.error("courses.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateCourseAction(id: string, input: CourseInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage courses." }
  const v = validateCourse(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateCourse(id, input)
    if (!updated) return { ok: false, reason: "Course not found." }
    revalidatePath("/courses")
    revalidatePath(`/courses/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("courses.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteCourseAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage courses." }
  try {
    const ok = await deleteCourse(id)
    revalidatePath("/courses")
    return { ok }
  } catch (e) {
    logger.error("courses.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedCoursesAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed courses." }
  try {
    const count = await seedCourses()
    revalidatePath("/courses")
    return { ok: true, count }
  } catch (e) {
    logger.error("courses.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
