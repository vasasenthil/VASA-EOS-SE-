import { wireWorkflowEngineToOutbox } from "@/lib/workflow-runtime/engine"
import { wireRetrainingOrchestrator } from "@/lib/ml/workers/retraining-orchestrator"
import { wireOutcomeCollector } from "@/lib/ml/feedback/outcome-collector"
import { dispatchOutboxBatch } from "@/lib/events/outbox-dispatcher"
import { listOutboxEvents } from "@/lib/events/outbox-publisher"
import { observeOutboxProcessingDuration, outboxEventsFailed, outboxEventsPending, outboxEventsProcessed } from "@/lib/observability/metrics"
import { structuredLog } from "@/lib/observability/traces"
import { WorkerBase } from "./worker-base"

export class OutboxDispatcherWorker extends WorkerBase {
  private readonly workerId = `outbox-${crypto.randomUUID()}`
  private unsubscribe: (() => void)[] = []
  constructor(private readonly batchSize = 50) { super({ name: "outbox-dispatcher", intervalMs: 2_000 }) }
  async start(): Promise<void> {
    if (!this.unsubscribe.length) this.unsubscribe = [wireWorkflowEngineToOutbox(), wireRetrainingOrchestrator(), wireOutcomeCollector()]
    try { await super.start() } catch (error) { this.clearSubscriptions(); throw error }
  }
  private clearSubscriptions(): void {
    for (const unsubscribe of this.unsubscribe) unsubscribe()
    this.unsubscribe = []
  }
  async stop(): Promise<void> { await super.stop(); this.clearSubscriptions() }
  protected async tick(correlationId: string): Promise<void> {
    const started = Date.now()
    const result = await dispatchOutboxBatch({ workerId: this.workerId, batchSize: this.batchSize })
    outboxEventsProcessed(result.processed)
    outboxEventsFailed(result.failed)
    observeOutboxProcessingDuration((Date.now() - started) / 1000)
    const rows = await listOutboxEvents()
    outboxEventsPending(rows.filter((row) => row.status === "pending").length)
    structuredLog("info", "outbox batch processed", { correlationId, processed: result.processed, failed: result.failed })
  }
}
