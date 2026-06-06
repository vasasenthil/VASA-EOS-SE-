"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createDrill, deleteDrill, listDrills, type NewDrill } from "@/lib/drills/store"
import type { Drill } from "@/lib/drills"
import { logger } from "@/lib/logger"

export async function listDrillsAction(): Promise<Drill[]> {
  noStore()
  try {
    return await listDrills()
  } catch (e) {
    logger.error("drills.list failed", { error: String(e) })
    return []
  }
}

export async function createDrillAction(input: NewDrill): Promise<Drill | null> {
  try {
    const d = await createDrill(input)
    revalidatePath("/mock-drills")
    return d
  } catch (e) {
    logger.error("drills.create failed", { error: String(e) })
    return null
  }
}

export async function deleteDrillAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteDrill(id)
    revalidatePath("/mock-drills")
    return ok
  } catch (e) {
    logger.error("drills.delete failed", { error: String(e) })
    return false
  }
}
