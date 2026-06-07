"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { recordMovement, listMovements, type NewMovement } from "@/lib/stock/store"
import type { Movement } from "@/lib/stock"
import { logger } from "@/lib/logger"

export async function listMovementsAction(): Promise<Movement[]> {
  noStore()
  try {
    return await listMovements()
  } catch (e) {
    logger.error("stock.list failed", { error: String(e) })
    return []
  }
}

export async function recordMovementAction(input: NewMovement): Promise<Movement | null> {
  try {
    const m = await recordMovement(input)
    revalidatePath("/inventory")
    return m
  } catch (e) {
    logger.error("stock.record failed", { error: String(e) })
    return null
  }
}
