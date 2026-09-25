import assert from "node:assert/strict"
import test from "node:test"
import { __setTestDb } from "@/lib/persistence"
import { commitWithEvents, outboxAdapter, resetMemoryOutbox, listOutboxEvents } from "@/lib/events/outbox-publisher"
import { resetDeadLettersForTests, listDeadLetters } from "@/lib/events/dead-letters"
import { createEventEnvelope } from "@/lib/events/schemas"

test("retryable failures remain claimable; fifth failure transfers once to DLQ", async t => {
  __setTestDb(null)
  resetMemoryOutbox(); resetDeadLettersForTests()
  let now = Date.now()
  t.mock.method(Date, "now", () => now)
  try {
    await commitWithEvents(async () => undefined, [createEventEnvelope({ eventType: "WorkflowCompleted", aggregateType: "workflow", aggregateId: "wf", idempotencyKey: "retry-test", payload: { workflowId: "wf", definitionId: "test", finalStepId: "last", decision: "approve", actorRole: "SYSTEM" } })])
    const adapter = outboxAdapter()
    for (let attempt = 1; attempt <= 5; attempt++) {
      const rows = await adapter.claimPending("owner", 1)
      assert.equal(rows.length, 1)
      await adapter.markFailed(rows[0].id, "owner", "intentional")
      const [row] = await listOutboxEvents()
      assert.equal(row.retry_count, attempt)
      assert.equal(row.status, attempt < 5 ? "pending" : "failed")
      assert.equal((await adapter.claimPending("owner", 1)).length, 0)
      now += 301_000
    }
    assert.equal((await listDeadLetters()).length, 1)
    const [row] = await listOutboxEvents()
    await adapter.markFailed(row.id, "owner", "duplicate completion")
    assert.equal((await listDeadLetters()).length, 1)
  } finally { __setTestDb(undefined) }
})
