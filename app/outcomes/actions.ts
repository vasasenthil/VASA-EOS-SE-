"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listOutcomes, createOutcome, seedOutcomes } from "@/lib/outcomes/store"
import { validateOutcome, type OutcomeInput } from "@/lib/outcomes"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listOutcomesAction() {
  noStore()
  try {
    return await listOutcomes()
  } catch (e) {
    logger.error("outcome.list failed", { error: String(e) })
    return []
  }
}

export async function createOutcomeAction(input: OutcomeInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to ingest outcomes." }
  const v = validateOutcome(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const r = await createOutcome(input)
    revalidatePath("/outcomes")
    return { ok: true, id: r.id }
  } catch (e) {
    logger.error("outcome.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedOutcomesAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed outcomes." }
  try {
    const count = await seedOutcomes()
    revalidatePath("/outcomes")
    return { ok: true, count }
  } catch (e) {
    logger.error("outcome.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
