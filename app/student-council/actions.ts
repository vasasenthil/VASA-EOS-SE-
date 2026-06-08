"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createCandidate, voteCandidate, declareElection, deleteCandidate, listCandidates, type NewCandidate } from "@/lib/council/store"
import type { Candidate } from "@/lib/council"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listCandidatesAction(): Promise<Candidate[]> {
  noStore()
  try {
    // Per-role data scoping: council candidates roll up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listCandidates())
  } catch (e) {
    logger.error("council.list failed", { error: String(e) })
    return []
  }
}

export async function createCandidateAction(input: NewCandidate): Promise<Candidate | null> {
  try {
    const c = await createCandidate(input)
    revalidatePath("/student-council")
    return c
  } catch (e) {
    logger.error("council.create failed", { error: String(e) })
    return null
  }
}

export async function voteCandidateAction(id: string): Promise<Candidate | null> {
  try {
    const c = await voteCandidate(id)
    revalidatePath("/student-council")
    return c ?? null
  } catch (e) {
    logger.error("council.vote failed", { error: String(e) })
    return null
  }
}

export async function declareElectionAction(): Promise<Candidate[]> {
  try {
    const all = await declareElection()
    revalidatePath("/student-council")
    return all
  } catch (e) {
    logger.error("council.declare failed", { error: String(e) })
    return []
  }
}

export async function deleteCandidateAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteCandidate(id)
    revalidatePath("/student-council")
    return ok
  } catch (e) {
    logger.error("council.delete failed", { error: String(e) })
    return false
  }
}
