import { commitWithEvents } from "@/lib/events/outbox-publisher"
import { createEventEnvelope, type PlatformEvent } from "@/lib/events/schemas"
import { listTimedOutWorkflowInstances, saveWorkflowInstance } from "./store"
import { workflowDefinitionFor } from "./schema"

export interface SlaMonitorResult {
  scanned: number
  timedOut: number
}

export async function runSlaMonitor(now = new Date()): Promise<SlaMonitorResult> {
  const timedOut = await listTimedOutWorkflowInstances(now)
  let emitted = 0
  for (const instance of timedOut) {
    const definition = workflowDefinitionFor(instance.workflowType)
    const step = definition.steps[instance.currentStepIndex]
    if (!step) continue
    const events: PlatformEvent[] = [createEventEnvelope({
      eventType: "WorkflowStepTimedOut",
      aggregateType: "workflow",
      aggregateId: instance.id,
      idempotencyKey: `workflow:${instance.id}:timeout:${instance.currentStepIndex}:${instance.currentStepStartedAt}`,
      payload: {
        workflowId: instance.id,
        definitionId: instance.workflowType,
        timedOutStepId: step.stepName,
        stepIndex: instance.currentStepIndex,
        slaDurationSeconds: step.slaDurationSeconds,
        timedOutAt: now.toISOString(),
      },
    })]
    await commitWithEvents(async () => {
      const current = { ...instance, status: "compensating" as const }
      await saveWorkflowInstance(current)
    }, events)
    emitted += 1
  }
  return { scanned: timedOut.length, timedOut: emitted }
}

export function createSlaMonitorPoller(options: { intervalMs?: number; now?: () => Date } = {}): { start(): void; stop(): void } {
  const intervalMs = options.intervalMs ?? 30_000
  const now = options.now ?? (() => new Date())
  let timer: ReturnType<typeof setInterval> | undefined
  let running = false

  async function tick(): Promise<void> {
    if (running) return
    running = true
    try {
      await runSlaMonitor(now())
    } finally {
      running = false
    }
  }

  return {
    start() {
      if (timer) return
      timer = setInterval(() => void tick(), intervalMs)
      void tick()
    },
    stop() {
      if (timer) clearInterval(timer)
      timer = undefined
    },
  }
}
