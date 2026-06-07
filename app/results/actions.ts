"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { publishResults, listPublications, type NewPublication, type ResultPublication } from "@/lib/results/store"
import { logger } from "@/lib/logger"

export async function listPublicationsAction(): Promise<ResultPublication[]> {
  noStore()
  try {
    return await listPublications()
  } catch (e) {
    logger.error("results.list failed", { error: String(e) })
    return []
  }
}

export async function publishResultsAction(input: NewPublication): Promise<ResultPublication | null> {
  try {
    const p = await publishResults(input)
    revalidatePath("/results")
    return p
  } catch (e) {
    logger.error("results.publish failed", { error: String(e) })
    return null
  }
}
