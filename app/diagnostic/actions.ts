"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { saveRound, listRounds, type NewRound, type DiagRound } from "@/lib/diagnostic/store"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listRoundsAction(): Promise<DiagRound[]> {
  noStore()
  try {
    // Per-role data scoping: diagnostic snapshots roll up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listRounds())
  } catch (e) {
    logger.error("diagnostic.list failed", { error: String(e) })
    return []
  }
}

export async function saveRoundAction(input: NewRound): Promise<DiagRound | null> {
  try {
    const r = await saveRound(input)
    revalidatePath("/diagnostic")
    return r
  } catch (e) {
    logger.error("diagnostic.save failed", { error: String(e) })
    return null
  }
}
