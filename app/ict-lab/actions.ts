"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createSession, deleteSession, listSessions, type NewSession } from "@/lib/ictlab/store"
import type { IctSession } from "@/lib/ictlab"
import { logger } from "@/lib/logger"

export async function listSessionsAction(): Promise<IctSession[]> {
  noStore()
  try {
    return await listSessions()
  } catch (e) {
    logger.error("ict.list failed", { error: String(e) })
    return []
  }
}

export async function createSessionAction(input: NewSession): Promise<IctSession | null> {
  try {
    const sn = await createSession(input)
    revalidatePath("/ict-lab")
    return sn
  } catch (e) {
    logger.error("ict.create failed", { error: String(e) })
    return null
  }
}

export async function deleteSessionAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteSession(id)
    revalidatePath("/ict-lab")
    return ok
  } catch (e) {
    logger.error("ict.delete failed", { error: String(e) })
    return false
  }
}
