// VASA-EOS(SE) — persistence seam for the interactive operational modules.
// Returns the privileged service-role client when configured, otherwise null.
// Each module uses this to persist to Supabase when the environment provides a
// service-role key, and transparently falls back to an in-memory store otherwise
// (so local/demo and CI builds work without any database).

import { supabaseAdmin } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"

// Test-only override. Undefined means "no override" (production behaviour);
// unit tests inject an in-memory fake here to exercise the DB code path.
let testOverride: SupabaseClient | null | undefined

/** The privileged DB client, or null when no service-role key is configured. */
export function getDb(): SupabaseClient | null {
  return testOverride !== undefined ? testOverride : supabaseAdmin
}

/** True when durable persistence is available. */
export function dbReady(): boolean {
  return getDb() !== null
}

/** Test-only seam: inject a fake client (or null) to exercise the DB path. */
export function __setTestDb(client: SupabaseClient | null | undefined): void {
  testOverride = client
}
