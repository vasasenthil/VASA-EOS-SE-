// VASA-EOS(SE) — Homework / assignment register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { newHwId, nextHwStatus, type Homework } from "./index"

interface Row {
  id: string
  subject: string
  title: string
  due_date: string
  status: Homework["status"]
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): Homework {
  return { id: r.id, subject: r.subject, title: r.title, dueDate: r.due_date, status: r.status, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

// Seeded across tenant nodes so homework rolls up by jurisdiction.
const store: Homework[] = [
  { id: "HW-SEED1", subject: "Science", title: "Photosynthesis worksheet", dueDate: "2026-06-10", status: "assigned", tenantId: "TN-CHN-B1-S1" },
  { id: "HW-SEED2", subject: "Mathematics", title: "Algebra set 3", dueDate: "2026-06-08", status: "submitted", tenantId: "TN-CHN-B2-S1" },
  { id: "HW-SEED3", subject: "Tamil", title: "Essay - my village", dueDate: "2026-06-05", status: "graded", tenantId: "TN-CBE-B1-S1" },
]

export interface NewHomework {
  subject: string
  title: string
  dueDate: string
  /** Tenant node the homework is assigned at; defaults to the demo school. */
  tenantId?: string
}

export async function createHomework(input: NewHomework): Promise<Homework> {
  const h: Homework = { id: newHwId(), subject: input.subject, title: input.title, dueDate: input.dueDate, status: "assigned", tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE }
  const db = getDb()
  if (db) {
    await db.from("homework").insert({
      id: h.id,
      subject: h.subject,
      title: h.title,
      due_date: h.dueDate,
      status: h.status,
      tenant_id: h.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(h)
  }
  await appendAudit({ actor: "teacher", action: "homework.assign", resource: h.id, details: { subject: h.subject } })
  return h
}

async function load(hid: string): Promise<Homework | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("homework").select("*").eq("id", hid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === hid)
}

export async function getHomework(hid: string): Promise<Homework | undefined> {
  return load(hid)
}

export async function advanceHomework(hid: string): Promise<Homework | undefined> {
  const h = await load(hid)
  if (!h) return undefined
  h.status = nextHwStatus(h.status)
  const db = getDb()
  if (db) await db.from("homework").update({ status: h.status }).eq("id", hid)
  await appendAudit({ actor: "teacher", action: "homework.advance", resource: hid, details: { status: h.status } })
  return h
}

export async function deleteHomework(hid: string): Promise<boolean> {
  const existing = await load(hid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("homework").delete().eq("id", hid)
  } else {
    const i = store.findIndex((x) => x.id === hid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "homework.delete", resource: hid })
  return true
}

export async function listHomework(): Promise<Homework[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("homework").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
