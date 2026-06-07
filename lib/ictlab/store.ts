// VASA-EOS(SE) — ICT-lab / smart-class usage log persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.
// Append-only records — create, list and (corrective) delete.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import type { IctSession } from "./index"

function id(): string {
  return `IC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  cls: string
  subject: string
  date: string
  students: number
  devices_working: number
  devices_total: number
  created_at: string
}

function fromRow(r: Row): IctSession {
  return {
    id: r.id,
    cls: r.cls,
    subject: r.subject,
    date: r.date,
    students: r.students,
    devicesWorking: r.devices_working,
    devicesTotal: r.devices_total,
  }
}

const store: IctSession[] = []

export interface NewSession {
  cls: string
  subject: string
  date: string
  students: number
  devicesWorking: number
  devicesTotal: number
}

export async function createSession(input: NewSession): Promise<IctSession> {
  const s: IctSession = { id: id(), ...input }
  const db = getDb()
  if (db) {
    await db.from("ict_sessions").insert({
      id: s.id,
      cls: s.cls,
      subject: s.subject,
      date: s.date,
      students: s.students,
      devices_working: s.devicesWorking,
      devices_total: s.devicesTotal,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(s)
  }
  await appendAudit({ actor: "ict", action: "ict.session", resource: s.id, details: { subject: s.subject } })
  return s
}

async function load(sid: string): Promise<IctSession | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("ict_sessions").select("*").eq("id", sid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === sid)
}

export async function getSession(sid: string): Promise<IctSession | undefined> {
  return load(sid)
}

export async function deleteSession(sid: string): Promise<boolean> {
  const existing = await load(sid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("ict_sessions").delete().eq("id", sid)
  } else {
    const i = store.findIndex((x) => x.id === sid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "ict.delete", resource: sid })
  return true
}

export async function listSessions(): Promise<IctSession[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("ict_sessions").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
