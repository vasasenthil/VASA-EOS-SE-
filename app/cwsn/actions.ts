"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createStudent, reviewStudent, deleteStudent, listStudents, type NewStudent } from "@/lib/cwsn/store"
import type { CwsnStudent } from "@/lib/cwsn"
import { logger } from "@/lib/logger"

export async function listStudentsAction(): Promise<CwsnStudent[]> {
  noStore()
  try {
    return await listStudents()
  } catch (e) {
    logger.error("cwsn.list failed", { error: String(e) })
    return []
  }
}

export async function createStudentAction(input: NewStudent): Promise<CwsnStudent | null> {
  try {
    const st = await createStudent(input)
    revalidatePath("/cwsn")
    return st
  } catch (e) {
    logger.error("cwsn.create failed", { error: String(e) })
    return null
  }
}

export async function reviewStudentAction(id: string): Promise<CwsnStudent | null> {
  try {
    const st = await reviewStudent(id)
    revalidatePath("/cwsn")
    return st ?? null
  } catch (e) {
    logger.error("cwsn.review failed", { error: String(e) })
    return null
  }
}

export async function deleteStudentAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteStudent(id)
    revalidatePath("/cwsn")
    return ok
  } catch (e) {
    logger.error("cwsn.delete failed", { error: String(e) })
    return false
  }
}
