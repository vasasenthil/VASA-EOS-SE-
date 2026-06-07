"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { savePlan, listPlans, type NewSeating, type SeatingSnapshot } from "@/lib/exam-seating/store"
import { logger } from "@/lib/logger"

export async function listPlansAction(): Promise<SeatingSnapshot[]> {
  noStore()
  try {
    return await listPlans()
  } catch (e) {
    logger.error("seating.list failed", { error: String(e) })
    return []
  }
}

export async function savePlanAction(input: NewSeating): Promise<SeatingSnapshot | null> {
  try {
    const p = await savePlan(input)
    revalidatePath("/exam-seating")
    return p
  } catch (e) {
    logger.error("seating.save failed", { error: String(e) })
    return null
  }
}
