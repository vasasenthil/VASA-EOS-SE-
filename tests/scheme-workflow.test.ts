import assert from "node:assert/strict"
import test from "node:test"

import { dispatchOutboxBatch, resetDispatcherState } from "@/lib/events/outbox-dispatcher"
import { listOutboxEvents, resetMemoryOutbox } from "@/lib/events/outbox-publisher"
import { approveSchemeStep, proposeScheme, rejectSchemeStep } from "@/lib/stores/scheme-approval-store"
import { allocateBudget, getBudgetStatus, recordUtilization, releaseFunds, resetSchemeBudgetStore } from "@/lib/stores/scheme-budget-store"
import { recordBeneficiary, recordOutcome, getOutcomeReport, resetSchemeOutcomeStore } from "@/lib/stores/scheme-outcome-store"
import { createScheme, getScheme, resetSchemeStore, schemeWorkflowId } from "@/lib/stores/scheme-store"
import { processWorkflowEvent, wireWorkflowEngineToOutbox } from "@/lib/workflow-runtime/engine"
import { runSlaMonitor } from "@/lib/workflow-runtime/sla-monitor"
import { getWorkflowInstance, resetWorkflowRuntimeStore, saveWorkflowInstance } from "@/lib/workflow-runtime/store"

test.beforeEach(() => {
  resetDispatcherState()
  resetMemoryOutbox()
  resetWorkflowRuntimeStore()
  resetSchemeStore()
  resetSchemeBudgetStore()
  resetSchemeOutcomeStore()
})

const proposal = {
  name: "District Digital Learning Labs",
  description: "Digital labs for government middle schools with device access and teacher enablement.",
  category: "digital_learning" as const,
  eligibility: "Government schools in aspirational blocks with ICT gaps",
  budget: 600_000_000,
  fiscalYear: "2026-27",
  timeline: { milestones: [{ name: "Pilot launch", dueDate: "2026-09-01T00:00:00.000Z" }] },
  proposedBy: "secretary@tn.gov",
  justification: "Improves digital access, lesson delivery and remediation across underserved schools.",
  expectedOutcomes: ["Raise digital lesson usage", "Improve foundational learning practice time"],
}

test("scheme lifecycle creates, proposes, advances workflow, tracks budget and outcomes", async () => {
  const unsubscribe = wireWorkflowEngineToOutbox()
  const scheme = await createScheme(proposal)
  assert.equal((await getScheme(scheme.id))?.status, "draft")

  await proposeScheme(scheme.id, "SECRETARY")
  const workflowId = schemeWorkflowId(scheme.id)
  assert.equal((await getScheme(scheme.id))?.status, "under_review")
  assert.equal((await getWorkflowInstance(workflowId))?.status, "running")

  await approveSchemeStep(workflowId, 0, "SECRETARY", "Policy alignment cleared")
  await dispatchOutboxBatch({ workerId: "scheme-test", batchSize: 20 })
  assert.equal((await getWorkflowInstance(workflowId))?.currentStepIndex, 1)

  const ministerEvent = (await listOutboxEvents()).find((row) => row.event.eventType === "WorkflowStepAdvanced" && row.event.payload.workflowId === workflowId)?.event
  assert.ok(ministerEvent)
  await processWorkflowEvent(ministerEvent)

  await allocateBudget(scheme.id, 600_000_000, "2026-27")
  await releaseFunds(scheme.id, 120_000_000, "2026-27")
  await recordUtilization(scheme.id, 30_000_000, "Pilot device procurement", "2026-27")
  const budget = await getBudgetStatus(scheme.id, "2026-27")
  assert.equal(budget.allocated, 600_000_000)
  assert.equal(budget.released, 120_000_000)
  assert.equal(budget.utilized, 30_000_000)

  await recordBeneficiary(scheme.id, { beneficiaryId: "SCH-001", beneficiaryName: "PUPS Thiruvallur", benefitType: "digital_lab", amount: 500000, district: "Thiruvallur" })
  await recordOutcome(scheme.id, { metricName: "schoolsEnabled", value: 1, evaluation: "Pilot school enabled with devices and teacher orientation." })
  const report = await getOutcomeReport(scheme.id)
  assert.equal(report.beneficiaries.length, 1)
  assert.equal(report.latestMetrics.schoolsEnabled, 1)

  const eventTypes = (await listOutboxEvents()).map((row) => row.event.eventType)
  assert.ok(eventTypes.includes("SchemeProposed"))
  assert.ok(eventTypes.includes("SchemeStepApproved"))
  assert.ok(eventTypes.includes("BudgetAllocated"))
  assert.ok(eventTypes.includes("OutcomeRecorded"))
  unsubscribe()
})

test("scheme SLA timeout emits timeout and compensation events", async () => {
  const unsubscribe = wireWorkflowEngineToOutbox()
  const scheme = await createScheme(proposal)
  await proposeScheme(scheme.id, "SECRETARY")
  const workflowId = schemeWorkflowId(scheme.id)
  const workflow = await getWorkflowInstance(workflowId)
  assert.ok(workflow)
  await saveWorkflowInstance({ ...workflow, currentStepStartedAt: "2026-07-01T00:00:00.000Z" })
  assert.deepEqual(await runSlaMonitor(new Date("2026-07-20T00:00:00.000Z")), { scanned: 1, timedOut: 1 })
  await dispatchOutboxBatch({ workerId: "scheme-sla", batchSize: 20 })
  assert.equal((await getWorkflowInstance(workflowId))?.status, "rejected")
  assert.ok((await listOutboxEvents()).some((row) => row.event.eventType === "WorkflowStepTimedOut"))
  unsubscribe()
})

test("scheme rejection emits rejection event and suspends scheme", async () => {
  const scheme = await createScheme(proposal)
  await proposeScheme(scheme.id, "SECRETARY")
  const workflowId = schemeWorkflowId(scheme.id)
  await rejectSchemeStep(workflowId, 0, "SECRETARY", "Insufficient district readiness evidence")
  assert.equal((await getScheme(scheme.id))?.status, "suspended")
  assert.ok((await listOutboxEvents()).some((row) => row.event.eventType === "SchemeStepRejected"))
})
