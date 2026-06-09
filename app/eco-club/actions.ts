"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createActivity, deleteActivity, listActivities, type NewActivity } from "@/lib/eco/store"
import type { EcoActivity } from "@/lib/eco"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listActivitiesAction(): Promise<EcoActivity[]> {
  noStore()
  try {
    // Per-role data scoping: eco activities roll up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listActivities())
  } catch (e) {
    logger.error("eco.list failed", { error: String(e) })
    return []
  }
}

export async function createActivityAction(input: NewActivity): Promise<EcoActivity | null> {
  try {
    const a = await createActivity(input)
    revalidatePath("/eco-club")
    return a
  } catch (e) {
    logger.error("eco.create failed", { error: String(e) })
    return null
  }
}

export async function deleteActivityAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteActivity(id)
    revalidatePath("/eco-club")
    return ok
  } catch (e) {
    logger.error("eco.delete failed", { error: String(e) })
    return false
  }
}
