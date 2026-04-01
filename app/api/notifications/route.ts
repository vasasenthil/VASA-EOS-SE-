import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

async function getSupabase() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createServerClient(url, key, {
    cookies: { get: (name) => cookieStore.get(name)?.value },
  })
}

/** GET /api/notifications — fetch unread notifications for the current user */
export async function GET() {
  try {
    const supabase = await getSupabase()
    if (!supabase) return NextResponse.json({ notifications: [], unread: 0 })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ notifications: [], unread: 0 })

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)

    const notifications = data ?? []
    const unread = notifications.filter((n: { read: boolean }) => !n.read).length

    return NextResponse.json({ notifications, unread })
  } catch {
    return NextResponse.json({ notifications: [], unread: 0 })
  }
}

/** PATCH /api/notifications — mark notifications as read */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getSupabase()
    if (!supabase) return NextResponse.json({ success: false })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false })

    const body = await request.json() as { id?: string; markAll?: boolean }

    if (body.markAll) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false)
    } else if (body.id) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", body.id)
        .eq("user_id", user.id)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false })
  }
}
