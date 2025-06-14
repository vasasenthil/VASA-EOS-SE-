// Using a route handler for logout for simplicity with form submission
// A server action in app/login/actions.ts or a dedicated auth actions file is also a good pattern.
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // Check if the user is currently signed in.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    await supabase.auth.signOut()
  }

  // Redirect to login page after logout
  // Ensure the redirect URL is absolute or correctly handled by your deployment.
  const redirectUrl = req.nextUrl.clone()
  redirectUrl.pathname = "/login"
  redirectUrl.searchParams.set("message", "You have been logged out.")

  return NextResponse.redirect(redirectUrl, {
    status: 302, // Standard redirect status
  })
}
