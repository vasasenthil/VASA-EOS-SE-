"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createCadet, logCadetHours, deleteCadet, listCadets, type NewCadet } from "@/lib/youth/store"
import type { Cadet } from "@/lib/youth"
import { logger } from "@/lib/logger"

export async function listCadetsAction(): Promise<Cadet[]> {
  noStore()
  try {
    return await listCadets()
  } catch (e) {
    logger.error("youth.list failed", { error: String(e) })
    return []
  }
}

export async function createCadetAction(input: NewCadet): Promise<Cadet | null> {
  try {
    const c = await createCadet(input)
    revalidatePath("/nss-ncc")
    return c
  } catch (e) {
    logger.error("youth.create failed", { error: String(e) })
    return null
  }
}

export async function logCadetHoursAction(id: string, hrs: number): Promise<Cadet | null> {
  try {
    const c = await logCadetHours(id, hrs)
    revalidatePath("/nss-ncc")
    return c ?? null
  } catch (e) {
    logger.error("youth.hours failed", { error: String(e) })
    return null
  }
}

export async function deleteCadetAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteCadet(id)
    revalidatePath("/nss-ncc")
    return ok
  } catch (e) {
    logger.error("youth.delete failed", { error: String(e) })
    return false
  }
}
