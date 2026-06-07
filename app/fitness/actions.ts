"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createRecord, deleteRecord, listRecords, type NewRecord } from "@/lib/fitness/store"
import type { FitnessRecord } from "@/lib/fitness"
import { logger } from "@/lib/logger"

export async function listRecordsAction(): Promise<FitnessRecord[]> {
  noStore()
  try {
    return await listRecords()
  } catch (e) {
    logger.error("fitness.list failed", { error: String(e) })
    return []
  }
}

export async function createRecordAction(input: NewRecord): Promise<FitnessRecord | null> {
  try {
    const r = await createRecord(input)
    revalidatePath("/fitness")
    return r
  } catch (e) {
    logger.error("fitness.create failed", { error: String(e) })
    return null
  }
}

export async function deleteRecordAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteRecord(id)
    revalidatePath("/fitness")
    return ok
  } catch (e) {
    logger.error("fitness.delete failed", { error: String(e) })
    return false
  }
}
