import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase/server" // Assuming supabaseAdmin is your service role client

// Helper to get the Supabase server client for user session
function createSupabaseServerClient() {
  const cookieStore = cookies()
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
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

/**
 * Retrieves the authenticated user's ID from the current session in a Server Action.
 * Returns the user ID string or null if not authenticated.
 */
export async function getUserIdFromAction(): Promise<string | null> {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting user from action:", error.message)
      return null
    }
    return user?.id || null
  } catch (e: any) {
    console.error("Unexpected error in getUserIdFromAction:", e.message)
    return null
  }
}

/**
 * Retrieves the full authenticated user object from the current session.
 * Useful if you need more than just the ID.
 */
export async function getUserFromAction() {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting user object from action:", error.message)
      return null
    }
    return user
  } catch (e: any) {
    console.error("Unexpected error in getUserFromAction:", e.message)
    return null
  }
}

/**
 * Retrieves the full authenticated user object from the current Supabase session.
 * This is the function that was repeatedly reported as missing.
 */
export async function getSupabaseAuthUser() {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting Supabase auth user:", error.message)
      return null
    }
    return user // Returns the full user object or null
  } catch (e: any) {
    console.error("Unexpected error in getSupabaseAuthUser:", e.message)
    return null
  }
}

// You might also want a function to get the service role client if needed for admin tasks
// This assumes you have SUPABASE_SERVICE_ROLE_KEY set in your environment
export function getSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    console.warn("Supabase admin client not configured. Service role key might be missing.")
    return null
  }
  return supabaseAdmin // from @/lib/supabase/server
}
