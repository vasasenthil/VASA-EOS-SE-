"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createLine, deleteLine, listLines, type NewLine } from "@/lib/vacancy/store"
import type { PostLine } from "@/lib/vacancy"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listLinesAction(): Promise<PostLine[]> {
  noStore()
  try {
    // Per-role data scoping: vacancy lines roll up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listLines())
  } catch (e) {
    logger.error("vacancy.list failed", { error: String(e) })
    return []
  }
}

export async function createLineAction(input: NewLine): Promise<PostLine | null> {
  try {
    const l = await createLine(input)
    revalidatePath("/vacancy")
    return l
  } catch (e) {
    logger.error("vacancy.create failed", { error: String(e) })
    return null
  }
}

export async function deleteLineAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteLine(id)
    revalidatePath("/vacancy")
    return ok
  } catch (e) {
    logger.error("vacancy.delete failed", { error: String(e) })
    return false
  }
}
