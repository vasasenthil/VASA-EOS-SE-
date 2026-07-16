import { getDb } from "@/lib/persistence"
import type { PlatformEvent } from "@/lib/events/schemas"

export class AtomicOutboxRpcError extends Error {
  readonly cause?: unknown
  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = "AtomicOutboxRpcError"
    this.cause = cause
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

export const genericAtomicCommitRpc = <T extends Record<string, unknown>>(
  targetTable: string,
  rowData: Record<string, unknown>,
  events: PlatformEvent[],
  tenantContext: Record<string, unknown> = {},
) =>
  callRpc<T>("platform_generic_atomic_commit", {
    p_table_name: targetTable,
    p_row_data: rowData,
    p_events: eventsToJson(events),
    p_tenant_context: tenantContext,
  })

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
