// VASA-EOS(SE) — Disciplinary / incident log persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.
// Sensitive safeguarding data — production restricts reads.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
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
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): Incident {
  return { id: r.id, student: r.student, type: r.type, severity: r.severity, action: r.action, date: r.date, status: r.status, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

// Seeded across tenant nodes so a district/state overseer sees several incidents
// while a single school sees only its own.
const store: Incident[] = [
  { id: "INC-SEED1", student: "Student A", type: "Bullying", severity: "serious", action: "Counselling + parents", date: "2026-05-28", status: "open", tenantId: "TN-CHN-B1-S1" },
  { id: "INC-SEED2", student: "Student B", type: "Property damage", severity: "moderate", action: "Restitution", date: "2026-05-25", status: "resolved", tenantId: "TN-CHN-B2-S1" },
  { id: "INC-SEED3", student: "Student C", type: "Absenteeism", severity: "minor", action: "Home visit", date: "2026-06-02", status: "open", tenantId: "TN-CBE-B1-S1" },
]

export interface NewIncident {
  student: string
  type: string
  severity: Severity
  action: string
  /** Tenant node the incident is filed against; defaults to the demo school. */
  tenantId?: string
}

export async function logIncident(input: NewIncident): Promise<Incident> {
  const inc: Incident = {
    id: id(),
    student: input.student,
    type: input.type,
    severity: input.severity,
    action: input.action,
    date: new Date().toISOString().slice(0, 10),
    status: "open",
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
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
      tenant_id: inc.tenantId,
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
