// Using a route handler for logout for simplicity with form submission
// A server action in app/login/actions.ts or a dedicated auth actions file is also a good pattern.
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { DEMO_COOKIE } from "@/lib/demo-auth"

export async function POST(req: NextRequest) {
  // Best-effort Supabase sign-out; never block logout if Supabase is unreachable.
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) {
      await supabase.auth.signOut()
    }
  } catch (e) {
    console.error("Logout: Supabase unreachable, clearing local session only.", e)
  }

  // Redirect to login page after logout
  const redirectUrl = req.nextUrl.clone()
  redirectUrl.pathname = "/login"
  redirectUrl.searchParams.set("message", "You have been logged out.")

  const res = NextResponse.redirect(redirectUrl, { status: 302 })
  // Clear any demo-login session too.
  res.cookies.set(DEMO_COOKIE, "", { path: "/", maxAge: 0 })
  return res
}
