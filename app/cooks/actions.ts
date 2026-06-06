"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createCook, setCookPresence, deleteCook, listCooks, type NewCook } from "@/lib/cooks/store"
import type { Cook } from "@/lib/cooks"
import { logger } from "@/lib/logger"

export async function listCooksAction(): Promise<Cook[]> {
  noStore()
  try {
    return await listCooks()
  } catch (e) {
    logger.error("cooks.list failed", { error: String(e) })
    return []
  }
}

export async function createCookAction(input: NewCook): Promise<Cook | null> {
  try {
    const c = await createCook(input)
    revalidatePath("/cooks")
    return c
  } catch (e) {
    logger.error("cooks.create failed", { error: String(e) })
    return null
  }
}

export async function setCookPresenceAction(id: string, present: boolean): Promise<Cook | null> {
  try {
    const c = await setCookPresence(id, present)
    revalidatePath("/cooks")
    return c ?? null
  } catch (e) {
    logger.error("cooks.presence failed", { error: String(e) })
    return null
  }
}

export async function deleteCookAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteCook(id)
    revalidatePath("/cooks")
    return ok
  } catch (e) {
    logger.error("cooks.delete failed", { error: String(e) })
    return false
  }
}
