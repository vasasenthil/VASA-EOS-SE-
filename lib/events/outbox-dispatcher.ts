import { outboxAdapter, type OutboxEventRecord } from "./outbox-publisher"
import { type PlatformEvent, type PlatformEventType } from "./schemas"

type Handler = (event: PlatformEvent) => Promise<void> | void

type SubscriptionKey = PlatformEventType | "*"

const handlers = new Map<SubscriptionKey, Set<Handler>>()
const processed = new Set<string>()

export interface DispatchResult {
  claimed: number
  processed: number
  failed: number
}

export interface DispatcherOptions {
  batchSize?: number
  workerId?: string
}

export function subscribeToPlatformEvents(type: SubscriptionKey, handler: Handler): () => void {
  const set = handlers.get(type) ?? new Set<Handler>()
  set.add(handler)
  handlers.set(type, set)
  return () => set.delete(handler)
}

export function resetDispatcherState(): void {
  handlers.clear()
  processed.clear()
}

async function dispatchEvent(record: OutboxEventRecord): Promise<void> {
  if (processed.has(record.idempotency_key)) return
  const specific = handlers.get(record.event.eventType) ?? new Set<Handler>()
  const wildcard = handlers.get("*") ?? new Set<Handler>()
  for (const handler of [...specific, ...wildcard]) await handler(record.event)
  processed.add(record.idempotency_key)
}

export async function dispatchOutboxBatch(options: DispatcherOptions = {}): Promise<DispatchResult> {
  const workerId = options.workerId ?? `worker-${crypto.randomUUID()}`
  const batchSize = options.batchSize ?? 50
  const adapter = outboxAdapter()
  const records = await adapter.claimPending(workerId, batchSize)
  let processedCount = 0
  let failed = 0

  for (const record of records) {
    try {
      await dispatchEvent(record)
      await adapter.markProcessed(record.id, workerId)
      processedCount += 1
    } catch (e) {
      failed += 1
      await adapter.markFailed(record.id, workerId, e instanceof Error ? e.message : String(e))
    }
  }

  return { claimed: records.length, processed: processedCount, failed }
}

export function createOutboxPoller(options: DispatcherOptions & { intervalMs?: number } = {}): { start(): void; stop(): void } {
  let timer: ReturnType<typeof setInterval> | undefined
  let running = false
  const intervalMs = options.intervalMs ?? 5_000

  async function tick(): Promise<void> {
    if (running) return
    running = true
    try {
      await dispatchOutboxBatch(options)
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
