// VASA-EOS(SE) — persistence seam for the interactive operational modules.
// Returns the privileged service-role client when configured, otherwise null.
// Each module uses this to persist to Supabase when the environment provides a
// service-role key, and transparently falls back to an in-memory store otherwise
// (so local/demo and CI builds work without any database).

import { supabaseAdmin } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"

/** The privileged DB client, or null when no service-role key is configured. */
export function getDb(): SupabaseClient | null {
  return supabaseAdmin
}

/** True when durable persistence is available. */
export function dbReady(): boolean {
  return supabaseAdmin !== null
}
