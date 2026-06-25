import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { isSupabaseAdminConfigured, isDemoModeEnabled, supabaseAdmin } from "@/lib/supabase/server"
import { DEMO_COOKIE } from "@/lib/demo-auth"
import type { User } from "@supabase/supabase-js"

// Demo session: when the credential-free walkthrough is active (no Supabase DB and a
// demo_role cookie set), treat the visitor as an authenticated demo user. Gated on the
// absence of a real database, so production always uses real Supabase auth.
async function demoSession(): Promise<{ id: string; role: string } | null> {
  if (!isDemoModeEnabled()) return null
  const role = (await cookies()).get(DEMO_COOKIE)?.value
  return role ? { id: `demo-${role.toLowerCase()}`, role: role.toUpperCase() } : null
}

function syntheticDemoUser(id: string): User {
  return {
    id,
    aud: "authenticated",
    role: "authenticated",
    email: "demo@vasa-eos.local",
    app_metadata: { provider: "demo" },
    user_metadata: { demo: true },
    created_at: new Date(0).toISOString(),
  } as unknown as User
}

// Helper to get the Supabase server client for user session
async function createSupabaseServerClient() {
  const cookieStore = await cookies()
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
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting user from action:", error.message)
      return (await demoSession())?.id ?? null
    }
    return user?.id || (await demoSession())?.id || null
  } catch (e: any) {
    console.error("Unexpected error in getUserIdFromAction:", e.message)
    return (await demoSession())?.id ?? null
  }
}

/**
 * Retrieves the full authenticated user object from the current session.
 * Useful if you need more than just the ID.
 */
export async function getUserFromAction() {
  try {
    const supabase = await createSupabaseServerClient()
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
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting Supabase auth user:", error.message)
      const demo = await demoSession()
      return demo ? syntheticDemoUser(demo.id) : null
    }
    if (user) return user
    const demo = await demoSession()
    return demo ? syntheticDemoUser(demo.id) : null
  } catch (e: any) {
    console.error("Unexpected error in getSupabaseAuthUser:", e.message)
    const demo = await demoSession()
    return demo ? syntheticDemoUser(demo.id) : null
  }
}

/**
 * Retrieves the Supabase admin client for performing privileged operations.
 */
export function getSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    console.warn("Supabase admin client not configured. Service role key might be missing.")
    return null
  }
  return supabaseAdmin // from @/lib/supabase/server
}

/**
 * Retrieves the current user's role and school ID from the custom 'users' table.
 * @param userId The ID of the user to look up.
 * @returns An object with role and schoolId, or null if not found or an error occurs.
 */
export async function getUserRoleAndSchool(userId: string): Promise<{ role: string; school_id: string | null } | null> {
  // Note: This function queries our custom 'users' table, not Supabase Auth claims.
  // It's designed for the MVP schema.
  try {
    const supabase = await createSupabaseServerClient()
    const { data: userProfile, error } = await supabase
      .from("users")
      .select("role, school_id")
      .eq("id", userId)
      .single()

    if (error) {
      // It's common for .single() to error if no rows are found. We can treat this as a non-critical error.
      if (error.code !== "PGRST116") {
        // PGRST116 = "JSON object requested, but 0 rows returned"
        console.error("Error fetching user role and school:", error.message)
      }
      return null
    }

    if (!userProfile) {
      console.warn(`No profile found for user ID: ${userId} in custom users table.`)
      return null
    }

    return {
      role: userProfile.role,
      school_id: userProfile.school_id,
    }
  } catch (e: any) {
    console.error("Unexpected error in getUserRoleAndSchool:", e.message)
    return null
  }
}

/**
 * Returns ALL roles a user holds, closing the multi-role gap: the primary role on public.users PLUS any roles
 * granted via user_ou_assignments (one per org unit). A user who is, say, TEACHER at a school and ACADEMIC_HEAD
 * at a cluster gets both — previously only the first (public.users.role) was ever resolved. Deduplicated;
 * always includes the primary role; degrades gracefully when the assignments tables are absent/empty.
 */
export async function getUserRoles(userId: string): Promise<string[]> {
  const roles = new Set<string>()
  const primary = await getUserRoleAndSchool(userId)
  if (primary?.role) roles.add(primary.role)
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from("user_ou_assignments")
      .select("roles(name)")
      .eq("user_id", userId)
    for (const row of (data ?? []) as Array<{ roles?: { name?: string } | null }>) {
      const name = row?.roles?.name
      if (name) roles.add(name)
    }
  } catch {
    // user_ou_assignments / roles tables are optional in the MVP schema — fall back to the primary role only.
  }
  return [...roles]
}
