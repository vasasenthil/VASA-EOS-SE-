// VASA-EOS(SE) — Disciplinary / incident log persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.
// Sensitive safeguarding data — production restricts reads.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import type { Incident, IncidentStatus, Severity } from "./index"

function id(): string {
  return `INC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  student: string
  type: string
  severity: Severity
  action: string
  date: string
  status: IncidentStatus
  created_at: string
}

function fromRow(r: Row): Incident {
  return { id: r.id, student: r.student, type: r.type, severity: r.severity, action: r.action, date: r.date, status: r.status }
}

const store: Incident[] = []

export interface NewIncident {
  student: string
  type: string
  severity: Severity
  action: string
}

export async function logIncident(input: NewIncident): Promise<Incident> {
  const inc: Incident = { id: id(), ...input, date: new Date().toISOString().slice(0, 10), status: "open" }
  const db = getDb()
  if (db) {
    await db.from("incidents").insert({
      id: inc.id,
      student: inc.student,
      type: inc.type,
      severity: inc.severity,
      action: inc.action,
      date: inc.date,
      status: inc.status,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(inc)
  }
  await appendAudit({ actor: "discipline", action: "incident.log", resource: inc.id, details: { severity: inc.severity } })
  return inc
}

async function load(iid: string): Promise<Incident | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("incidents").select("*").eq("id", iid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === iid)
}

export async function getIncident(iid: string): Promise<Incident | undefined> {
  return load(iid)
}

export async function resolveIncident(iid: string): Promise<Incident | undefined> {
  const inc = await load(iid)
  if (!inc) return undefined
  inc.status = "resolved"
  const db = getDb()
  if (db) await db.from("incidents").update({ status: inc.status }).eq("id", iid)
  await appendAudit({ actor: "discipline", action: "incident.resolve", resource: iid })
  return inc
}

export async function deleteIncident(iid: string): Promise<boolean> {
  const existing = await load(iid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("incidents").delete().eq("id", iid)
  } else {
    const i = store.findIndex((x) => x.id === iid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "incident.delete", resource: iid })
  return true
}

export async function listIncidents(): Promise<Incident[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("incidents").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
