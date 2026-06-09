"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createIndent, receiveCopies, deleteIndent, listIndents, type NewIndent } from "@/lib/textbooks/store"
import type { Indent } from "@/lib/textbooks"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listIndentsAction(): Promise<Indent[]> {
  noStore()
  try {
    // Per-role data scoping: textbook indents roll up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listIndents())
  } catch (e) {
    logger.error("textbook.list failed", { error: String(e) })
    return []
  }
}

export async function createIndentAction(input: NewIndent): Promise<Indent | null> {
  try {
    const it = await createIndent(input)
    revalidatePath("/textbooks")
    return it
  } catch (e) {
    logger.error("textbook.create failed", { error: String(e) })
    return null
  }
}

export async function receiveCopiesAction(id: string, qty: number): Promise<Indent | null> {
  try {
    const it = await receiveCopies(id, qty)
    revalidatePath("/textbooks")
    return it ?? null
  } catch (e) {
    logger.error("textbook.receive failed", { error: String(e) })
    return null
  }
}

export async function deleteIndentAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteIndent(id)
    revalidatePath("/textbooks")
    return ok
  } catch (e) {
    logger.error("textbook.delete failed", { error: String(e) })
    return false
  }
}
