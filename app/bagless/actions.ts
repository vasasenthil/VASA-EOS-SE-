"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createActivity, deleteActivity, listActivities, type NewActivity } from "@/lib/bagless/store"
import type { BaglessActivity } from "@/lib/bagless"
import { logger } from "@/lib/logger"

export async function listActivitiesAction(): Promise<BaglessActivity[]> {
  noStore()
  try {
    return await listActivities()
  } catch (e) {
    logger.error("bagless.list failed", { error: String(e) })
    return []
  }
}

export async function createActivityAction(input: NewActivity): Promise<BaglessActivity | null> {
  try {
    const a = await createActivity(input)
    revalidatePath("/bagless")
    return a
  } catch (e) {
    logger.error("bagless.create failed", { error: String(e) })
    return null
  }
}

export async function deleteActivityAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteActivity(id)
    revalidatePath("/bagless")
    return ok
  } catch (e) {
    logger.error("bagless.delete failed", { error: String(e) })
    return false
  }
}
