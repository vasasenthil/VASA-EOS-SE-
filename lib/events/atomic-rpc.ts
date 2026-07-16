import { getDb } from "@/lib/persistence"
import type { PlatformEvent } from "@/lib/events/schemas"

export class AtomicOutboxRpcError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = "AtomicOutboxRpcError"
  }
}

const eventsToJson = (events: PlatformEvent[]) => events

async function callRpc<T>(name: string, params: Record<string, unknown>): Promise<T> {
  const db = getDb()
  if (!db) throw new AtomicOutboxRpcError("Supabase admin client is not configured for atomic outbox RPC calls")
  const { data, error } = await db.rpc(name, params)
  if (error) throw new AtomicOutboxRpcError(`RPC ${name} failed: ${error.message}`, error)
  return data as T
}

export const insertWithOutboxRpc = (targetTable: string, rowData: Record<string, unknown>, events: PlatformEvent[]) =>
  callRpc<string>("insert_with_outbox", { target_table: targetTable, row_data: rowData, events: eventsToJson(events) })

export const updateWithOutboxRpc = (targetTable: string, targetId: string, patchData: Record<string, unknown>, events: PlatformEvent[]) =>
  callRpc<string>("update_with_outbox", { target_table: targetTable, target_id: targetId, patch_data: patchData, events: eventsToJson(events) })

export const scholarshipFileWithOutboxRpc = (application: Record<string, unknown>, events: PlatformEvent[]) =>
  callRpc<string>("scholarship_file_with_outbox", { application, events: eventsToJson(events) })

export const tcFileWithOutboxRpc = (application: Record<string, unknown>, events: PlatformEvent[]) =>
  callRpc<string>("tc_file_with_outbox", { application, events: eventsToJson(events) })

export const schemeProposeWithOutboxRpc = (schemeId: string, proposedBy: string, proposal: Record<string, unknown>, events: PlatformEvent[]) =>
  callRpc<string>("scheme_propose_with_outbox", { scheme_id: schemeId, proposed_by: proposedBy, proposal, events: eventsToJson(events) })
