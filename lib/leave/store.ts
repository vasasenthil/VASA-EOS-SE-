// VASA-EOS(SE) — Teacher leave-request register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import type { LeaveRequest, LeaveStatus, LeaveType } from "./index"

function id(): string {
  return `LV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  teacher: string
  type: LeaveType
  from_date: string
  to_date: string
  reason: string
  status: LeaveStatus
  created_at: string
}

function fromRow(r: Row): LeaveRequest {
  return { id: r.id, teacher: r.teacher, type: r.type, from: r.from_date, to: r.to_date, reason: r.reason, status: r.status }
}

const store: LeaveRequest[] = []

export interface NewLeave {
  teacher: string
  type: LeaveType
  from: string
  to: string
  reason: string
}

export async function fileLeave(input: NewLeave): Promise<LeaveRequest> {
  const r: LeaveRequest = { id: id(), ...input, status: "pending" }
  const db = getDb()
  if (db) {
    await db.from("leave_requests").insert({
      id: r.id,
      teacher: r.teacher,
      type: r.type,
      from_date: r.from,
      to_date: r.to,
      reason: r.reason,
      status: r.status,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(r)
  }
  await appendAudit({ actor: r.teacher, action: "leave.file", resource: r.id, details: { type: r.type } })
  return r
}

async function load(lid: string): Promise<LeaveRequest | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("leave_requests").select("*").eq("id", lid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === lid)
}

export async function getLeave(lid: string): Promise<LeaveRequest | undefined> {
  return load(lid)
}

export async function decideLeave(lid: string, status: LeaveStatus): Promise<LeaveRequest | undefined> {
  const r = await load(lid)
  if (!r) return undefined
  r.status = status
  const db = getDb()
  if (db) await db.from("leave_requests").update({ status }).eq("id", lid)
  await appendAudit({ actor: "approver", action: "leave.decide", resource: lid, details: { status } })
  return r
}

export async function deleteLeave(lid: string): Promise<boolean> {
  const existing = await load(lid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("leave_requests").delete().eq("id", lid)
  } else {
    const i = store.findIndex((x) => x.id === lid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "leave.delete", resource: lid })
  return true
}

export async function listLeave(): Promise<LeaveRequest[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("leave_requests").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
