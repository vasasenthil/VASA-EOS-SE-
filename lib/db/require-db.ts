import { getDb } from "@/lib/persistence"
import type { SupabaseClient } from "@supabase/supabase-js"

export class ProductionDatabaseError extends Error {
  constructor(message = "Database required in production") {
    super(message)
    this.name = "ProductionDatabaseError"
  }
}

/**
 * Return the privileged durable database client or fail closed.
 *
 * Production code must not silently degrade to in-memory stores. Local tests can
 * inject a fake client through `__setTestDb`; otherwise missing DB configuration
 * is surfaced as an explicit deployment/configuration error.
 */
export function requireDb(): SupabaseClient {
  const db = getDb()
  if (!db) {
    throw new ProductionDatabaseError(
      process.env.NODE_ENV === "production"
        ? "Database required in production"
        : "Database required for durable store operation",
    )
  }
  return db
}
