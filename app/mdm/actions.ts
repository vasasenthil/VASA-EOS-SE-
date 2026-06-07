"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { recordEntry, deleteEntry, listEntries, type NewEntry } from "@/lib/mdm/store"
import type { MdmEntry } from "@/lib/mdm"
import { logger } from "@/lib/logger"

export async function listEntriesAction(): Promise<MdmEntry[]> {
  noStore()
  try {
    return await listEntries()
  } catch (e) {
    logger.error("mdm.list failed", { error: String(e) })
    return []
  }
}

export async function recordEntryAction(input: NewEntry): Promise<MdmEntry | null> {
  try {
    const e = await recordEntry(input)
    revalidatePath("/mdm")
    return e
  } catch (e) {
    logger.error("mdm.record failed", { error: String(e) })
    return null
  }
}

export async function deleteEntryAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteEntry(id)
    revalidatePath("/mdm")
    return ok
  } catch (e) {
    logger.error("mdm.delete failed", { error: String(e) })
    return false
  }
}
