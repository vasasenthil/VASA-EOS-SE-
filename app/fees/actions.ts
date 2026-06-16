"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { saveCollection, latestCollection, type NewFeeCollection, type FeeCollectionRecord } from "@/lib/fees/store"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function latestFeeCollectionAction(udiseCode?: string): Promise<FeeCollectionRecord | null> {
  noStore()
  try {
    return (await latestCollection(udiseCode)) ?? null
  } catch (e) {
    logger.error("fees.latest failed", { error: String(e) })
    return null
  }
}

export async function saveFeeCollectionAction(input: NewFeeCollection): Promise<{ ok: boolean; record?: FeeCollectionRecord; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to record fee collection." }
  try {
    const record = await saveCollection(input)
    revalidatePath("/(dashboards)/principal/dashboard")
    return { ok: true, record }
  } catch (e) {
    logger.error("fees.save failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
