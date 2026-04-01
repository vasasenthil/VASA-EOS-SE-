/**
 * Notification creation utility.
 * Inserts a row into the `notifications` Supabase table.
 *
 * Table schema (run once in Supabase SQL editor):
 *   create table if not exists notifications (
 *     id         uuid primary key default gen_random_uuid(),
 *     user_id    uuid references auth.users(id),
 *     title      text not null,
 *     message    text not null,
 *     type       text not null default 'info',   -- info | success | warning | error
 *     link       text,
 *     read       boolean not null default false,
 *     created_at timestamptz default now()
 *   );
 *   create index on notifications(user_id, read, created_at desc);
 */

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function getSupabase() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createServerClient(url, key, {
    cookies: { get: (name) => cookieStore.get(name)?.value },
  })
}

export type NotificationType = "info" | "success" | "warning" | "error"

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = "info",
  link?: string
) {
  try {
    const supabase = await getSupabase()
    if (!supabase) return
    await supabase.from("notifications").insert({
      user_id: userId,
      title,
      message,
      type,
      link: link ?? null,
      read: false,
    })
  } catch {
    // Notification failures must never break the calling operation
  }
}

export type NotificationRow = {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  link: string | null
  read: boolean
  created_at: string
}

export async function getUserNotifications(
  userId: string,
  limit = 20
): Promise<NotificationRow[]> {
  try {
    const supabase = await getSupabase()
    if (!supabase) return []
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)
    return (data as NotificationRow[]) ?? []
  } catch {
    return []
  }
}

export async function markNotificationRead(id: string) {
  try {
    const supabase = await getSupabase()
    if (!supabase) return
    await supabase.from("notifications").update({ read: true }).eq("id", id)
  } catch {}
}

export async function markAllNotificationsRead(userId: string) {
  try {
    const supabase = await getSupabase()
    if (!supabase) return
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false)
  } catch {}
}
