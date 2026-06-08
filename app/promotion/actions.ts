"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { saveRun, listRuns, type NewRun, type PromotionRun } from "@/lib/promotion/store"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listRunsAction(): Promise<PromotionRun[]> {
  noStore()
  try {
    // Per-role data scoping: promotion runs roll up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listRuns())
  } catch (e) {
    logger.error("promotion.list failed", { error: String(e) })
    return []
  }
}

export async function saveRunAction(input: NewRun): Promise<PromotionRun | null> {
  try {
    const r = await saveRun(input)
    revalidatePath("/promotion")
    return r
  } catch (e) {
    logger.error("promotion.save failed", { error: String(e) })
    return null
  }
}
