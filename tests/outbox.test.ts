import assert from "node:assert/strict"
import test from "node:test"

import { dispatchOutboxBatch, resetDispatcherState, subscribeToPlatformEvents } from "@/lib/events/outbox-dispatcher"
import { commitWithEvents, listOutboxEvents, resetMemoryOutbox } from "@/lib/events/outbox-publisher"
import { createEventEnvelope } from "@/lib/events/schemas"
import { decideScholarshipWithOutbox, fileScholarshipWithOutbox } from "@/lib/stores/scholarship-store"
import { decideTcWithOutbox, fileTcWithOutbox } from "@/lib/stores/tc-store"

test.beforeEach(() => {
  resetMemoryOutbox()
  resetDispatcherState()
})

test("commitWithEvents persists valid events and dispatcher invokes subscribers once", async () => {
  const event = createEventEnvelope({
    eventType: "ScholarshipFiled",
    aggregateType: "scholarship",
    aggregateId: "SCH-1",
    idempotencyKey: "scholarship:SCH-1:filed",
    payload: { scholarshipId: "SCH-1", workflowId: "WF-1", student: "Asha", scheme: "Post Matric", amount: 5000, tenantId: "TN-S" },
  })

  const result = await commitWithEvents(async () => ({ ok: true }), [event])
  assert.deepEqual(result, { ok: true })
  assert.equal((await listOutboxEvents()).length, 1)

  const seen: string[] = []
  subscribeToPlatformEvents("ScholarshipFiled", (evt) => { seen.push(evt.id) })
  assert.deepEqual(await dispatchOutboxBatch({ workerId: "test-worker", batchSize: 10 }), { claimed: 1, processed: 1, failed: 0 })
  assert.deepEqual(seen, [event.id])
  assert.equal((await listOutboxEvents())[0].status, "processed")

  assert.deepEqual(await dispatchOutboxBatch({ workerId: "test-worker", batchSize: 10 }), { claimed: 0, processed: 0, failed: 0 })
  assert.deepEqual(seen, [event.id])
})

test("scholarship outbox store emits filed and sanction events", async () => {
  const filed = await fileScholarshipWithOutbox({ student: "Kavi", scheme: "Merit", amount: 1000 })
  await decideScholarshipWithOutbox({ id: filed.id, actorRole: "PRINCIPAL", actor: "HM", decision: "approve" })
  await decideScholarshipWithOutbox({ id: filed.id, actorRole: "BEO", actor: "BEO-1", decision: "approve" })
  await decideScholarshipWithOutbox({ id: filed.id, actorRole: "DEO", actor: "Treasury", decision: "approve" })

  const types = (await listOutboxEvents()).map((row) => row.event.eventType)
  assert.ok(types.includes("ScholarshipFiled"))
  assert.ok(types.includes("ScholarshipSanctioned"))
  assert.ok(types.includes("WorkflowCompleted"))
})

test("transfer certificate outbox store emits filed and issued events", async () => {
  const filed = await fileTcWithOutbox({ student: "Ravi", needsCountersign: false, details: { needsCountersign: false } })
  await decideTcWithOutbox({ id: filed.id, actorRole: "ACADEMIC_HEAD", actor: "Teacher", decision: "approve" })
  await decideTcWithOutbox({ id: filed.id, actorRole: "PRINCIPAL", actor: "Principal", decision: "approve" })

  const types = (await listOutboxEvents()).map((row) => row.event.eventType)
  assert.ok(types.includes("TransferCertificateFiled"))
  assert.ok(types.includes("TransferCertificateIssued"))
  assert.ok(types.includes("WorkflowCompleted"))
})
