"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileBudget, actOnBudget, listBudgets, type NewBudget, type BudgetFlowRecord } from "@/lib/budgetflow/store"
import type { Decision } from "@/lib/workflow"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listBudgetsAction(): Promise<BudgetFlowRecord[]> {
  noStore()
  try {
    return await listBudgets()
  } catch (e) {
    logger.error("budgetflow.list failed", { error: String(e) })
    return []
  }
}

export async function fileBudgetAction(input: NewBudget): Promise<BudgetFlowRecord | null> {
  try {
    const rec = await fileBudget(input)
    revalidatePath("/budget-approvals")
    return rec
  } catch (e) {
    logger.error("budgetflow.file failed", { error: String(e) })
    return null
  }
}

export async function decideBudgetAction(input: { id: string; actorRole: string; actor: string; decision: Decision; note?: string }): Promise<{ ok: boolean; record?: BudgetFlowRecord; reason?: string }> {
  if (!(await canDo("manage:governance"))) return { ok: false, reason: "You do not have permission to act on budget proposals." }
  try {
    const res = await actOnBudget(input.id, { actorRole: input.actorRole, actor: input.actor, decision: input.decision, note: input.note })
    revalidatePath("/budget-approvals")
    return res
  } catch (e) {
    logger.error("budgetflow.decide failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
