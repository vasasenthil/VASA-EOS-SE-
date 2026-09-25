import { AsyncLocalStorage } from "node:async_hooks"
import type { SupabaseClient } from "@supabase/supabase-js"

export interface DomainMutation { table: string; mode: "insert" | "upsert" | "update" | "delete"; row: object; keys: string[]; expected?: object }
export const domainTransaction = new AsyncLocalStorage<DomainMutation[]>()

// A callback may read data and stage commands, but cannot make independent writes.
export function readOnlyDuringTransaction(db: SupabaseClient): SupabaseClient {
  if (!domainTransaction.getStore()) return db
  return new Proxy(db, { get(target, property) {
    if (property === "rpc") return () => { throw new Error("RPC inside staged transaction is not allowed") }
    if (property === "from") return (table: string) => new Proxy(target.from(table), {
      get(builder, method) {
        if (["insert", "update", "upsert", "delete"].includes(String(method))) return () => { throw new Error("Use persistDomainMutation inside commitWithEvents") }
        const value = Reflect.get(builder, method)
        return typeof value === "function" ? value.bind(builder) : value
      },
    })
    const value = Reflect.get(target, property)
    return typeof value === "function" ? value.bind(target) : value
  } })
}
