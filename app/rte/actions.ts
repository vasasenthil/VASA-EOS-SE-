"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createApplicant, advanceApplicant, deleteApplicant, listApplicants, type NewApplicant } from "@/lib/rte/store"
import type { RteApplicant } from "@/lib/rte"
import { canDo } from "@/lib/access/guard"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listApplicantsAction(): Promise<RteApplicant[]> {
  noStore()
  try {
    // Per-role data scoping: RTE intake rolls up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listApplicants())
  } catch (e) {
    logger.error("rte.list failed", { error: String(e) })
    return []
  }
}

export async function createApplicantAction(input: NewApplicant): Promise<RteApplicant | null> {
  try {
    const a = await createApplicant(input)
    revalidatePath("/rte")
    return a
  } catch (e) {
    logger.error("rte.create failed", { error: String(e) })
    return null
  }
}

export async function advanceApplicantAction(id: string): Promise<RteApplicant | null> {
  if (!(await canDo("manage:school"))) return null
  try {
    const a = await advanceApplicant(id)
    revalidatePath("/rte")
    return a ?? null
  } catch (e) {
    logger.error("rte.advance failed", { error: String(e) })
    return null
  }
}

export async function deleteApplicantAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteApplicant(id)
    revalidatePath("/rte")
    return ok
  } catch (e) {
    logger.error("rte.delete failed", { error: String(e) })
    return false
  }
}
