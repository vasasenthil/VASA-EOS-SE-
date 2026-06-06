"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createRti, advanceRti, deleteRti, listRti, type NewRti } from "@/lib/rti/store"
import type { RtiRequest } from "@/lib/rti"
import { logger } from "@/lib/logger"

export async function listRtiAction(): Promise<RtiRequest[]> {
  noStore()
  try {
    return await listRti()
  } catch (e) {
    logger.error("rti.list failed", { error: String(e) })
    return []
  }
}

export async function createRtiAction(input: NewRti): Promise<RtiRequest | null> {
  try {
    const r = await createRti(input)
    revalidatePath("/rti")
    return r
  } catch (e) {
    logger.error("rti.create failed", { error: String(e) })
    return null
  }
}

export async function advanceRtiAction(id: string): Promise<RtiRequest | null> {
  try {
    const r = await advanceRti(id)
    revalidatePath("/rti")
    return r ?? null
  } catch (e) {
    logger.error("rti.advance failed", { error: String(e) })
    return null
  }
}

export async function deleteRtiAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteRti(id)
    revalidatePath("/rti")
    return ok
  } catch (e) {
    logger.error("rti.delete failed", { error: String(e) })
    return false
  }
}
