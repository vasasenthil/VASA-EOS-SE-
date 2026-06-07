"use server"

import { revalidatePath } from "next/cache"
import { unstable_noStore as noStore } from "next/cache"
import { createConcern, advanceConcern, deleteConcern, listConcerns, type NewConcern } from "@/lib/safety/store"
import type { SafetyConcern } from "@/lib/safety"
import { canDo } from "@/lib/access/guard"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

// Server actions for the Safety committee log. All fail soft: a persistence error
// never crashes the page — the UI keeps its optimistic state and the error is logged.

export async function listConcernsAction(): Promise<SafetyConcern[]> {
  noStore()
  try {
    // Per-role data scoping: a Principal sees one school's concerns, a BEO a block's,
    // a DEO a district's, the State all. This is the reference enforcement wiring.
    return await scopeForCurrentSubject(await listConcerns())
  } catch (e) {
    logger.error("safety.list failed", { error: String(e) })
    return []
  }
}

export async function createConcernAction(input: NewConcern): Promise<SafetyConcern | null> {
  if (!(await canDo("manage:school"))) return null
  try {
    const c = await createConcern(input)
    revalidatePath("/safety")
    return c
  } catch (e) {
    logger.error("safety.create failed", { error: String(e) })
    return null
  }
}

export async function advanceConcernAction(id: string): Promise<SafetyConcern | null> {
  if (!(await canDo("manage:school"))) return null
  try {
    const c = await advanceConcern(id)
    revalidatePath("/safety")
    return c ?? null
  } catch (e) {
    logger.error("safety.advance failed", { error: String(e) })
    return null
  }
}

export async function deleteConcernAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteConcern(id)
    revalidatePath("/safety")
    return ok
  } catch (e) {
    logger.error("safety.delete failed", { error: String(e) })
    return false
  }
}
