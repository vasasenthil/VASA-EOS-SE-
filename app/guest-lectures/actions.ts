"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createLecture, deleteLecture, listLectures, type NewLecture } from "@/lib/guestlectures/store"
import type { Lecture } from "@/lib/guestlectures"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listLecturesAction(): Promise<Lecture[]> {
  noStore()
  try {
    // Per-role data scoping: guest lectures roll up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listLectures())
  } catch (e) {
    logger.error("lecture.list failed", { error: String(e) })
    return []
  }
}

export async function createLectureAction(input: NewLecture): Promise<Lecture | null> {
  try {
    const l = await createLecture(input)
    revalidatePath("/guest-lectures")
    return l
  } catch (e) {
    logger.error("lecture.create failed", { error: String(e) })
    return null
  }
}

export async function deleteLectureAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteLecture(id)
    revalidatePath("/guest-lectures")
    return ok
  } catch (e) {
    logger.error("lecture.delete failed", { error: String(e) })
    return false
  }
}
