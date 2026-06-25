"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { publishResults, listPublications, type NewPublication, type ResultPublication } from "@/lib/results/store"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { integrations } from "@/lib/integrations"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { logger } from "@/lib/logger"

export async function listPublicationsAction(): Promise<ResultPublication[]> {
  noStore()
  try {
    // Per-role data scoping: result publications roll up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listPublications())
  } catch (e) {
    logger.error("results.list failed", { error: String(e) })
    return []
  }
}

export async function publishResultsAction(input: NewPublication): Promise<ResultPublication | null> {
  try {
    const p = await publishResults(input)
    // Best-effort: lodge the candidate batch with the DGE / Government-Examinations
    // board. Non-blocking and audited; mock by default, live once INTEGRATION_EXAMS
    // is configured.
    try {
      const res = await integrations.exams.registerCandidates({
        examCode: p.examName,
        udiseCode: input.tenantId ?? DEFAULT_SCHOOL_NODE,
        count: p.candidates,
      })
      logger.info("results.lodge", { id: p.id, mode: res.mode, ok: res.ok, batchId: res.data?.batchId })
    } catch (e) {
      logger.warn("results.lodge failed", { id: p.id, error: String(e) })
    }
    revalidatePath("/results")
    return p
  } catch (e) {
    logger.error("results.publish failed", { error: String(e) })
    return null
  }
}

/** Pull a published result summary for an exam from the DGE board (real consumer). */
export async function fetchBoardResultsAction(examCode: string) {
  try {
    const res = await integrations.exams.fetchResults(examCode)
    return { ok: res.ok, mode: res.mode, data: res.data ?? null, error: res.error }
  } catch (e) {
    logger.error("results.board-fetch failed", { error: String(e) })
    return { ok: false, mode: "live" as const, data: null, error: "Server error." }
  }
}
