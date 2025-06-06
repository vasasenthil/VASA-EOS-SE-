import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Corrected variable name

let supabaseAdminInstance: SupabaseClient | null = null

// Attempt to initialize the client only if both environment variables are present.
if (supabaseUrl && supabaseServiceRoleKey) {
  try {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  } catch (e: any) {
    // If createClient itself throws an error, log it but don't crash the server.
    console.error("Error initializing Supabase admin client:", e.message)
    supabaseAdminInstance = null
  }
} else {
  // Silently fail without creating a client instance if env vars are missing.
  // Add warnings for easier debugging on the server.
  if (!supabaseUrl) {
    console.warn("Supabase admin client: NEXT_PUBLIC_SUPABASE_URL is not set.")
  }
  if (!supabaseServiceRoleKey) {
    console.warn("Supabase admin client: SUPABASE_SERVICE_ROLE_KEY is not set.")
  }
}

export const supabaseAdmin = supabaseAdminInstance

// A helper function to check configuration status from actions.
export const isSupabaseAdminConfigured = (): boolean => !!supabaseAdminInstance
