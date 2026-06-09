"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { recordResult, deleteResult, listResults, type NewResult } from "@/lib/sports/store"
import type { SportResult } from "@/lib/sports"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listResultsAction(): Promise<SportResult[]> {
  noStore()
  try {
    // Per-role data scoping: meet results roll up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listResults())
  } catch (e) {
    logger.error("sports.list failed", { error: String(e) })
    return []
  }
}

export async function recordResultAction(input: NewResult): Promise<SportResult | null> {
  try {
    const r = await recordResult(input)
    revalidatePath("/sports")
    return r
  } catch (e) {
    logger.error("sports.record failed", { error: String(e) })
    return null
  }
}

export async function deleteResultAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteResult(id)
    revalidatePath("/sports")
    return ok
  } catch (e) {
    logger.error("sports.delete failed", { error: String(e) })
    return false
  }
}
