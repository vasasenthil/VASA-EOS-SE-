"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { recordMovement, listMovements, type NewMovement } from "@/lib/stock/store"
import type { Movement } from "@/lib/stock"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listMovementsAction(): Promise<Movement[]> {
  noStore()
  try {
    // Per-role data scoping: stock movements roll up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listMovements())
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
