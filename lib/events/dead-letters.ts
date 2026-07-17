import { getDb } from "@/lib/persistence"
import type { OutboxEventRecord } from "./outbox-publisher"

export type DeadLetterStatus = "open" | "retried" | "discarded"
export interface DeadLetterRecord {
  id: string
  outbox_event_id?: string | null
  aggregate_type: string
  aggregate_id: string
  event_type: string
  payload: Record<string, unknown>
  retry_count: number
  last_error: string
  status: DeadLetterStatus
  failed_at: string
  resolved_at?: string | null
}

const memoryDeadLetters = new Map<string, DeadLetterRecord>()
const uuid = () => crypto.randomUUID()

export async function moveToDeadLetter(event: OutboxEventRecord, error: Error | string): Promise<DeadLetterRecord> {
  const message = typeof error === "string" ? error : error.message
  const db = getDb()
  if (db) {
    const { data, error: dbError } = await db.from("platform_outbox_dead_letters").insert({ outbox_event_id: event.id, aggregate_type: event.aggregate_type, aggregate_id: event.aggregate_id, event_type: event.event_type, payload: event.payload, retry_count: event.retry_count, last_error: message, status: "open" }).select("*").single()
    if (dbError) throw dbError
    return data as DeadLetterRecord
  }
  const row: DeadLetterRecord = { id: uuid(), outbox_event_id: event.id, aggregate_type: event.aggregate_type, aggregate_id: event.aggregate_id, event_type: event.event_type, payload: event.payload, retry_count: event.retry_count, last_error: message, status: "open", failed_at: new Date().toISOString(), resolved_at: null }
  memoryDeadLetters.set(row.id, row)
  return row
}

export async function listDeadLetters(filters: { eventType?: string; status?: DeadLetterStatus } = {}): Promise<DeadLetterRecord[]> {
  const db = getDb()
  if (db) {
    let query = db.from("platform_outbox_dead_letters").select("*").order("failed_at", { ascending: false })
    if (filters.eventType) query = query.eq("event_type", filters.eventType)
    if (filters.status) query = query.eq("status", filters.status)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as DeadLetterRecord[]
  }
  return [...memoryDeadLetters.values()].filter((row) => (!filters.eventType || row.event_type === filters.eventType) && (!filters.status || row.status === filters.status))
}

export async function retryDeadLetter(id: string): Promise<string> {
  const db = getDb()
  if (db) {
    const { data, error } = await db.rpc("platform_retry_dead_letter", { dead_letter_id: id })
    if (error) throw error
    return data as string
  }
  const row = memoryDeadLetters.get(id)
  if (!row || row.status !== "open") throw new Error(`open dead letter ${id} not found`)
  row.status = "retried"
  row.resolved_at = new Date().toISOString()
  return uuid()
}

export async function discardDeadLetter(id: string): Promise<void> {
  const db = getDb()
  if (db) {
    const { error } = await db.from("platform_outbox_dead_letters").update({ status: "discarded", resolved_at: new Date().toISOString() }).eq("id", id).eq("status", "open")
    if (error) throw error
    return
  }
  const row = memoryDeadLetters.get(id)
  if (!row || row.status !== "open") throw new Error(`open dead letter ${id} not found`)
  row.status = "discarded"
  row.resolved_at = new Date().toISOString()
}

export function resetDeadLettersForTests(): void { memoryDeadLetters.clear() }
