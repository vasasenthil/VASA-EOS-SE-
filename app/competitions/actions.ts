"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createEntry, deleteEntry, listEntries, type NewEntry } from "@/lib/competitions/store"
import type { CompEntry } from "@/lib/competitions"
import { logger } from "@/lib/logger"

export async function listEntriesAction(): Promise<CompEntry[]> {
  noStore()
  try {
    return await listEntries()
  } catch (e) {
    logger.error("competitions.list failed", { error: String(e) })
    return []
  }
}

export async function createEntryAction(input: NewEntry): Promise<CompEntry | null> {
  try {
    const en = await createEntry(input)
    revalidatePath("/competitions")
    return en
  } catch (e) {
    logger.error("competitions.create failed", { error: String(e) })
    return null
  }
}

export async function deleteEntryAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteEntry(id)
    revalidatePath("/competitions")
    return ok
  } catch (e) {
    logger.error("competitions.delete failed", { error: String(e) })
    return false
  }
}
