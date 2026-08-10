import { dispatchOutboxBatch } from "@/lib/events/outbox-dispatcher"
import { listOutboxEvents } from "@/lib/events/outbox-publisher"
import { moveToDeadLetter } from "@/lib/events/dead-letters"
import { observeOutboxProcessingDuration, outboxEventsFailed, outboxEventsPending, outboxEventsProcessed } from "@/lib/observability/metrics"
import { structuredLog } from "@/lib/observability/traces"
import { WorkerBase } from "./worker-base"

export class OutboxDispatcherWorker extends WorkerBase {
  constructor(private readonly batchSize = 50, private readonly maxRetries = 5) { super({ name: "outbox-dispatcher", intervalMs: 2_000 }) }
  protected async tick(correlationId: string): Promise<void> {
    const started = Date.now()
    const result = await dispatchOutboxBatch({ workerId: `outbox-${process.pid}`, batchSize: this.batchSize })
    outboxEventsProcessed(result.processed)
    outboxEventsFailed(result.failed)
    observeOutboxProcessingDuration((Date.now() - started) / 1000)
    const rows = await listOutboxEvents()
    outboxEventsPending(rows.filter((row) => row.status === "pending").length)
    for (const row of rows.filter((row) => row.status === "failed" && row.retry_count >= this.maxRetries)) {
      await moveToDeadLetter(row, row.last_error ?? "max retry count exceeded")
    }
    structuredLog("info", "outbox batch processed", { correlationId, processed: result.processed, failed: result.failed })
  }
}

if (require.main === module) void new OutboxDispatcherWorker().start()
