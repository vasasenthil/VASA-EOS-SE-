import type { PlatformEvent } from "@/lib/events/schemas"
import { createEventEnvelope } from "@/lib/events/schemas"
import { commitWithEvents } from "@/lib/events/outbox-publisher"
import { persistDomainMutation } from "@/lib/persistence/domain-mutation"
import { requireDb } from "@/lib/db/require-db"
import { getScheme, saveSchemeRecord } from "@/lib/stores/scheme-store"
import { getWorkflowInstance, saveWorkflowInstance } from "./store"

/** Only persisted completion of all human approvals authorizes these system steps. */
export async function runSchemeSystemSteps(event: PlatformEvent): Promise<void> {
  if (event.eventType !== "SchemeStepApproved") return
  const scheme = await getScheme(event.aggregateId)
  if (!scheme || scheme.status !== "approved" || !scheme.workflowId) return
  const workflow = await getWorkflowInstance(scheme.workflowId)
  if (!workflow || workflow.status !== "running" || workflow.currentStepIndex !== 3) return
  const now = new Date().toISOString()
  const { data: budget, error } = await requireDb().from("scheme_budgets").select("*").eq("scheme_id", scheme.id).eq("fiscal_year", scheme.fiscalYear).maybeSingle()
  if (error) throw error
  // Do not reset a pre-existing budget or override a treasury allocation.
  if (budget && Number(budget.allocated) !== scheme.budget) throw new Error("Approved scheme and allocated budget differ")
  const events = [createEventEnvelope({ eventType: "SchemeActivated", aggregateType: "scheme", aggregateId: scheme.id,
    idempotencyKey: `scheme:${scheme.id}:system-activation`, payload: { schemeId: scheme.id, status: "active", workflowId: workflow.id } } as any)]
  await commitWithEvents(async () => {
    if (!budget) await persistDomainMutation("scheme_budgets", "insert", { scheme_id: scheme.id, fiscal_year: scheme.fiscalYear, allocated: scheme.budget, released: 0, utilized: 0, updated_at: now }, ["scheme_id", "fiscal_year"])
    await saveWorkflowInstance({ ...workflow, currentStepIndex: 5, status: "completed" })
    await saveSchemeRecord({ ...scheme, status: "active", updatedAt: now }, scheme)
  }, events)
}
