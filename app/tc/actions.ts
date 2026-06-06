"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createTc, advanceTc, deleteTc, listTc, type NewTc } from "@/lib/tc/store"
import type { TcRequest } from "@/lib/tc"
import { logger } from "@/lib/logger"

export async function listTcAction(): Promise<TcRequest[]> {
  noStore()
  try {
    return await listTc()
  } catch (e) {
    logger.error("tc.list failed", { error: String(e) })
    return []
  }
}

export async function createTcAction(input: NewTc): Promise<TcRequest | null> {
  try {
    const t = await createTc(input)
    revalidatePath("/tc")
    return t
  } catch (e) {
    logger.error("tc.create failed", { error: String(e) })
    return null
  }
}

export async function advanceTcAction(id: string): Promise<TcRequest | null> {
  try {
    const t = await advanceTc(id)
    revalidatePath("/tc")
    return t ?? null
  } catch (e) {
    logger.error("tc.advance failed", { error: String(e) })
    return null
  }
}

export async function deleteTcAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteTc(id)
    revalidatePath("/tc")
    return ok
  } catch (e) {
    logger.error("tc.delete failed", { error: String(e) })
    return false
  }
}
