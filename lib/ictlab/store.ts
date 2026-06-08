// VASA-EOS(SE) — ICT-lab / smart-class usage log persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.
// Append-only records — create, list and (corrective) delete.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
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
  tenant_id: string
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
    tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE,
  }
}

// Seeded across tenant nodes so ICT-lab usage rolls up by jurisdiction.
const store: IctSession[] = [
  { id: "IC-SEED1", cls: "9-A", subject: "Science", date: "2026-06-02", students: 38, devicesWorking: 20, devicesTotal: 20, tenantId: "TN-CHN-B1-S1" },
  { id: "IC-SEED2", cls: "10-B", subject: "Coding / robotics", date: "2026-06-01", students: 42, devicesWorking: 15, devicesTotal: 20, tenantId: "TN-CHN-B2-S1" },
  { id: "IC-SEED3", cls: "8-C", subject: "Mathematics", date: "2026-05-30", students: 35, devicesWorking: 18, devicesTotal: 18, tenantId: "TN-CBE-B1-S1" },
]

export interface NewSession {
  cls: string
  subject: string
  date: string
  students: number
  devicesWorking: number
  devicesTotal: number
  /** Tenant node the session is logged at; defaults to the demo school. */
  tenantId?: string
}

export async function createSession(input: NewSession): Promise<IctSession> {
  const s: IctSession = { id: id(), ...input, tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE }
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
      tenant_id: s.tenantId,
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
