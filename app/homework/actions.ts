"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createHomework, advanceHomework, deleteHomework, listHomework, type NewHomework } from "@/lib/homework/store"
import type { Homework } from "@/lib/homework"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listHomeworkAction(): Promise<Homework[]> {
  noStore()
  try {
    // Per-role data scoping: homework rolls up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listHomework())
  } catch (e) {
    logger.error("homework.list failed", { error: String(e) })
    return []
  }
}

export async function createHomeworkAction(input: NewHomework): Promise<Homework | null> {
  try {
    const h = await createHomework(input)
    revalidatePath("/homework")
    return h
  } catch (e) {
    logger.error("homework.create failed", { error: String(e) })
    return null
  }
}

export async function advanceHomeworkAction(id: string): Promise<Homework | null> {
  try {
    const h = await advanceHomework(id)
    revalidatePath("/homework")
    return h ?? null
  } catch (e) {
    logger.error("homework.advance failed", { error: String(e) })
    return null
  }
}

export async function deleteHomeworkAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteHomework(id)
    revalidatePath("/homework")
    return ok
  } catch (e) {
    logger.error("homework.delete failed", { error: String(e) })
    return false
  }
}
