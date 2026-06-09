"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createReader, promoteReader, logBook, deleteReader, listReaders, type NewReader } from "@/lib/reading/store"
import type { Reader } from "@/lib/reading"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listReadersAction(): Promise<Reader[]> {
  noStore()
  try {
    // Per-role data scoping: reading-level progress rolls up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listReaders())
  } catch (e) {
    logger.error("reading.list failed", { error: String(e) })
    return []
  }
}

export async function createReaderAction(input: NewReader): Promise<Reader | null> {
  try {
    const r = await createReader(input)
    revalidatePath("/reading")
    return r
  } catch (e) {
    logger.error("reading.create failed", { error: String(e) })
    return null
  }
}

export async function promoteReaderAction(id: string): Promise<Reader | null> {
  try {
    const r = await promoteReader(id)
    revalidatePath("/reading")
    return r ?? null
  } catch (e) {
    logger.error("reading.promote failed", { error: String(e) })
    return null
  }
}

export async function logBookAction(id: string): Promise<Reader | null> {
  try {
    const r = await logBook(id)
    revalidatePath("/reading")
    return r ?? null
  } catch (e) {
    logger.error("reading.book failed", { error: String(e) })
    return null
  }
}

export async function deleteReaderAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteReader(id)
    revalidatePath("/reading")
    return ok
  } catch (e) {
    logger.error("reading.delete failed", { error: String(e) })
    return false
  }
}
