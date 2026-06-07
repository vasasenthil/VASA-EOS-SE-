"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { checkIn, checkOut, deleteVisitor, listVisitors, type NewVisitor } from "@/lib/visitors/store"
import type { Visitor } from "@/lib/visitors"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listVisitorsAction(): Promise<Visitor[]> {
  noStore()
  try {
    // Per-role data scoping: the gate log rolls up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listVisitors())
  } catch (e) {
    logger.error("visitor.list failed", { error: String(e) })
    return []
  }
}

export async function checkInAction(input: NewVisitor): Promise<Visitor | null> {
  try {
    const v = await checkIn(input)
    revalidatePath("/visitors")
    return v
  } catch (e) {
    logger.error("visitor.checkin failed", { error: String(e) })
    return null
  }
}

export async function checkOutAction(id: string, outTime: string): Promise<Visitor | null> {
  try {
    const v = await checkOut(id, outTime)
    revalidatePath("/visitors")
    return v ?? null
  } catch (e) {
    logger.error("visitor.checkout failed", { error: String(e) })
    return null
  }
}
