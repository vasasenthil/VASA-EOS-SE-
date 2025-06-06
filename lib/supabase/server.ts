import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

let supabaseAdminInstance: SupabaseClient | null = null

// Attempt to initialize the client only if both environment variables are present.
// This approach avoids throwing errors or logging loud warnings during server startup.
if (supabaseUrl && supabaseServiceKey) {
  try {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
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
  // The actions that use this client will handle the null case.
}

export const supabaseAdmin = supabaseAdminInstance

// A helper function to check configuration status from actions.
export const isSupabaseAdminConfigured = (): boolean => !!supabaseAdminInstance
