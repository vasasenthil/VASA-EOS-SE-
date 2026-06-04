import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"

// This is a flexible, generic server client creator that can be used in various server contexts.
// It's useful in Route Handlers or other places where you might pass the cookie store explicitly.
export function createSupabaseServerClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}

// This is a convenience wrapper for creating a client in Server Components and Server Actions
// where `cookies()` from `next/headers` is readily available.
export const createClient = async () => {
  const cookieStore = await cookies()
  return createSupabaseServerClient(cookieStore)
}

// --- Admin Client ---
// This is a privileged client that uses the service_role key.
// It should ONLY be used in server-side code for operations that need to bypass RLS.
let supabaseAdminInstance: SupabaseClient | null = null

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabaseAdminInstance = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    )
  } catch (e: any) {
    console.error("Error initializing Supabase admin client:", e.message)
    supabaseAdminInstance = null
  }
} else {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn("Supabase admin client: NEXT_PUBLIC_SUPABASE_URL is not set.")
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("Supabase admin client: SUPABASE_SERVICE_ROLE_KEY is not set.")
  }
}

export const supabaseAdmin = supabaseAdminInstance

// Helper function to check if the admin client is configured.
export const isSupabaseAdminConfigured = (): boolean => !!supabaseAdminInstance
