import { getDb } from "@/lib/persistence"
import { assertNonProductionMemoryAdapter } from "@/lib/runtime/production-guard"
import { type PlatformEvent, parsePlatformEvent } from "./schemas"

export type OutboxStatus = "pending" | "processed" | "failed"

export interface OutboxRow {
  id: string
  aggregate_type: string
  aggregate_id: string
  event_type: string
  payload: Record<string, unknown>
  status: OutboxStatus
  created_at: string
  processed_at: string | null
  retry_count: number
  idempotency_key: string
  last_error?: string | null
  locked_at?: string | null
  locked_by?: string | null
}

export interface OutboxEventRecord extends OutboxRow {
  event: PlatformEvent
}

export interface TransactionalOutboxAdapter {
  commitWithEvents<T>(domainOperation: () => Promise<T>, events: PlatformEvent[]): Promise<T>
  claimPending(workerId: string, batchSize: number): Promise<OutboxEventRecord[]>
  markProcessed(id: string, workerId: string): Promise<void>
  markFailed(id: string, workerId: string, error: string): Promise<void>
  list(): Promise<OutboxEventRecord[]>
  reset?(): void
}

function validateEvents(events: PlatformEvent[]): PlatformEvent[] {
  return events.map(parsePlatformEvent)
}

function rowFromEvent(event: PlatformEvent, now: string): OutboxEventRecord {
  return {
    id: event.id,
    aggregate_type: event.aggregateType,
    aggregate_id: event.aggregateId,
    event_type: event.eventType,
    payload: event.payload as Record<string, unknown>,
    status: "pending",
    created_at: now,
    processed_at: null,
    retry_count: 0,
    idempotency_key: event.idempotencyKey,
    locked_at: null,
    locked_by: null,
    last_error: null,
    event,
  }
}

function eventFromRow(row: OutboxRow): PlatformEvent {
  return parsePlatformEvent({
    id: row.id,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    eventType: row.event_type,
    payload: row.payload,
    occurredAt: row.created_at,
    idempotencyKey: row.idempotency_key,
  })
}

class MemoryOutboxAdapter implements TransactionalOutboxAdapter {
  private allowMemory(): void { assertNonProductionMemoryAdapter("transactional-outbox") }
  private rows = new Map<string, OutboxEventRecord>()
  private keys = new Set<string>()
  private queue: Promise<unknown> = Promise.resolve()

  async commitWithEvents<T>(domainOperation: () => Promise<T>, events: PlatformEvent[]): Promise<T> {
    this.allowMemory()
    return this.serial(async () => {
      const result = await domainOperation()
      const valid = validateEvents(events)
      const now = new Date().toISOString()
      for (const event of valid) {
        if (this.keys.has(event.idempotencyKey)) continue
        const row = rowFromEvent(event, now)
        this.rows.set(row.id, row)
        this.keys.add(row.idempotency_key)
      }
      return result
    })
  }

  async claimPending(workerId: string, batchSize: number): Promise<OutboxEventRecord[]> {
    this.allowMemory()
    return this.serial(async () => {
      const limit = Math.max(1, batchSize)
      const rows = [...this.rows.values()]
        .filter((row) => row.status === "pending" && !row.locked_by)
        .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
        .slice(0, limit)
      const now = new Date().toISOString()
      for (const row of rows) {
        row.locked_by = workerId
        row.locked_at = now
      }
      return rows.map((row) => ({ ...row, event: row.event }))
    })
  }

  async markProcessed(id: string, workerId: string): Promise<void> {
    this.allowMemory()
    await this.serial(async () => {
      const row = this.rows.get(id)
      if (row && row.status === "pending" && row.locked_by === workerId) {
        row.status = "processed"
        row.processed_at = new Date().toISOString()
        row.locked_by = null
        row.locked_at = null
        row.last_error = null
      }
    })
  }

  async markFailed(id: string, workerId: string, error: string): Promise<void> {
    this.allowMemory()
    await this.serial(async () => {
      const row = this.rows.get(id)
      if (row && row.status === "pending" && row.locked_by === workerId) {
        row.status = "failed"
        row.retry_count += 1
        row.locked_by = null
        row.locked_at = null
        row.last_error = error.slice(0, 2000)
      }
    })
  }

  async list(): Promise<OutboxEventRecord[]> {
    this.allowMemory()
    return [...this.rows.values()].map((row) => ({ ...row, event: row.event }))
  }

  reset(): void {
    this.rows.clear()
    this.keys.clear()
    this.queue = Promise.resolve()
  }

  private async serial<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(fn, fn)
    this.queue = run.then(() => undefined, () => undefined)
    return run
  }
}

class SupabaseOutboxAdapter implements TransactionalOutboxAdapter {
  async commitWithEvents<T>(domainOperation: () => Promise<T>, events: PlatformEvent[]): Promise<T> {
    const db = getDb()
    if (!db) return memoryAdapter.commitWithEvents(domainOperation, events)
    const result = await domainOperation()
    const valid = validateEvents(events)
    const { error } = await db.rpc("platform_commit_outbox_events", { events: valid })
    if (error) throw error
    return result
  }

  async claimPending(workerId: string, batchSize: number): Promise<OutboxEventRecord[]> {
    const db = getDb()
    if (!db) return memoryAdapter.claimPending(workerId, batchSize)
    const { data, error } = await db.rpc("platform_claim_outbox_batch", { worker_id: workerId, batch_size: batchSize })
    if (error) throw error
    return ((data as OutboxRow[] | null) ?? []).map((row) => ({ ...row, event: eventFromRow(row) }))
  }

  async markProcessed(id: string, workerId: string): Promise<void> {
    const db = getDb()
    if (!db) return memoryAdapter.markProcessed(id, workerId)
    const { error } = await db.rpc("platform_mark_outbox_processed", { event_id: id, worker_id: workerId })
    if (error) throw error
  }

  async markFailed(id: string, workerId: string, errorMessage: string): Promise<void> {
    const db = getDb()
    if (!db) return memoryAdapter.markFailed(id, workerId, errorMessage)
    const { error } = await db.rpc("platform_mark_outbox_failed", { event_id: id, worker_id: workerId, error_message: errorMessage })
    if (error) throw error
  }

  async list(): Promise<OutboxEventRecord[]> {
    const db = getDb()
    if (!db) return memoryAdapter.list()
    const { data, error } = await db.from("platform_outbox").select("*").order("created_at", { ascending: true })
    if (error) throw error
    return ((data as OutboxRow[] | null) ?? []).map((row) => ({ ...row, event: eventFromRow(row) }))
  }
}

const memoryAdapter = new MemoryOutboxAdapter()
let adapter: TransactionalOutboxAdapter = new SupabaseOutboxAdapter()

export function setOutboxAdapterForTests(next: TransactionalOutboxAdapter | null): void {
  adapter = next ?? new SupabaseOutboxAdapter()
}

export function resetMemoryOutbox(): void {
  memoryAdapter.reset()
}

export function outboxAdapter(): TransactionalOutboxAdapter {
  return adapter
}

export async function commitWithEvents<T>(domainOperation: () => Promise<T>, events: PlatformEvent[]): Promise<T> {
  return adapter.commitWithEvents(domainOperation, events)
}

export async function listOutboxEvents(): Promise<OutboxEventRecord[]> {
  return adapter.list()
}
