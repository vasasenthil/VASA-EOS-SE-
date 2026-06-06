"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createChild, advanceChild, deleteChild, listChildren, type NewChild } from "@/lib/oosc/store"
import type { OoscChild } from "@/lib/oosc"
import { logger } from "@/lib/logger"

export async function listChildrenAction(): Promise<OoscChild[]> {
  noStore()
  try {
    return await listChildren()
  } catch (e) {
    logger.error("oosc.list failed", { error: String(e) })
    return []
  }
}

export async function createChildAction(input: NewChild): Promise<OoscChild | null> {
  try {
    const c = await createChild(input)
    revalidatePath("/oosc")
    return c
  } catch (e) {
    logger.error("oosc.create failed", { error: String(e) })
    return null
  }
}

export async function advanceChildAction(id: string): Promise<OoscChild | null> {
  try {
    const c = await advanceChild(id)
    revalidatePath("/oosc")
    return c ?? null
  } catch (e) {
    logger.error("oosc.advance failed", { error: String(e) })
    return null
  }
}

export async function deleteChildAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteChild(id)
    revalidatePath("/oosc")
    return ok
  } catch (e) {
    logger.error("oosc.delete failed", { error: String(e) })
    return false
  }
}
