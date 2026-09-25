import { getDb } from "./index"
import { domainTransaction, type DomainMutation } from "./transaction-context"

/** Stage a supported domain command; the outbox adapter submits the entire batch once. */
export async function persistDomainMutation(table: string, mode: DomainMutation["mode"], row: object, keys = ["id"], expected?: object): Promise<void> {
  const command = { table, mode, row: structuredClone(row), keys, expected }
  const pending = domainTransaction.getStore()
  if (pending) { pending.push(command); return }
  const db = getDb()
  if (!db) throw new Error("Durable database required")
  const { error } = await db.rpc("platform_apply_domain_commands", {
    command_id: crypto.randomUUID(), commands: [command], events: [], command_result: null,
  })
  if (error) throw error
}
