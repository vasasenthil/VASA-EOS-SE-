/**
 * Audit logging utility.
 * Inserts a row into the `audit_logs` Supabase table.
 *
 * Table schema (run once in Supabase SQL editor):
 *   create table if not exists audit_logs (
 *     id          uuid primary key default gen_random_uuid(),
 *     user_id     uuid references auth.users(id),
 *     action      text not null,          -- e.g. CREATE, UPDATE, DELETE, APPROVE
 *     resource    text not null,          -- e.g. policy, user, milestone, ou
 *     resource_id text not null,
 *     changes     jsonb,                  -- { before: {...}, after: {...} }
 *     created_at  timestamptz default now()
 *   );
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

export async function auditLog(
  action: string,
  resource: string,
  resourceId: string,
  userId: string,
  changes?: object
) {
  try {
    const supabase = await getSupabase()
    if (!supabase) return
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      resource,
      resource_id: resourceId,
      changes: changes ?? null,
    })
  } catch {
    // Audit log failures must never break the main operation
  }
}

export type AuditLogEntry = {
  id: string
  user_id: string
  action: string
  resource: string
  resource_id: string
  changes: Record<string, unknown> | null
  created_at: string
}

export async function getAuditLogs(options?: {
  resource?: string
  userId?: string
  limit?: number
}): Promise<AuditLogEntry[]> {
  try {
    const supabase = await getSupabase()
    if (!supabase) return []

    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(options?.limit ?? 100)

    if (options?.resource) query = query.eq("resource", options.resource)
    if (options?.userId) query = query.eq("user_id", options.userId)

    const { data } = await query
    return (data as AuditLogEntry[]) ?? []
  } catch {
    return []
  }
}
