// VASA-EOS(SE) — Guest-lecture / resource-person register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.
// Append-only records — create, list and (corrective) delete.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { Lecture } from "./index"

function id(): string {
  return `GL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  speaker: string
  topic: string
  org: string
  domain: string
  date: string
  audience: number
  cls: string
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): Lecture {
  return {
    id: r.id,
    speaker: r.speaker,
    topic: r.topic,
    org: r.org,
    domain: r.domain,
    date: r.date,
    audience: r.audience,
    cls: r.cls,
    tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE,
  }
}

// Seeded across tenant nodes so guest-lecture coverage rolls up by jurisdiction.
const store: Lecture[] = [
  { id: "GL-SEED1", speaker: "Dr. Latha", topic: "Careers in science", org: "IIT-M", domain: "Career guidance", date: "2026-05-21", audience: 120, cls: "11-12", tenantId: "TN-CHN-B1-S1" },
  { id: "GL-SEED2", speaker: "Mr. Raghu", topic: "Cyber safety", org: "TN Police", domain: "Civic / legal awareness", date: "2026-05-26", audience: 200, cls: "9-10", tenantId: "TN-CHN-B2-S1" },
  { id: "GL-SEED3", speaker: "Ms. Anjali", topic: "Startup basics", org: "TN Startup", domain: "Entrepreneurship", date: "2026-06-02", audience: 80, cls: "11", tenantId: "TN-CBE-B1-S1" },
]

export interface NewLecture {
  speaker: string
  topic: string
  org: string
  domain: string
  date: string
  audience: number
  cls: string
  /** Tenant node the lecture is logged at; defaults to the demo school. */
  tenantId?: string
}

export async function createLecture(input: NewLecture): Promise<Lecture> {
  const l: Lecture = { id: id(), ...input, tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE }
  const db = getDb()
  if (db) {
    await db.from("guest_lectures").insert({
      id: l.id,
      speaker: l.speaker,
      topic: l.topic,
      org: l.org,
      domain: l.domain,
      date: l.date,
      audience: l.audience,
      cls: l.cls,
      tenant_id: l.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(l)
  }
  await appendAudit({ actor: "school", action: "lecture.log", resource: l.id, details: { domain: l.domain } })
  return l
}

async function load(lid: string): Promise<Lecture | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("guest_lectures").select("*").eq("id", lid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === lid)
}

export async function getLecture(lid: string): Promise<Lecture | undefined> {
  return load(lid)
}

export async function deleteLecture(lid: string): Promise<boolean> {
  const existing = await load(lid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("guest_lectures").delete().eq("id", lid)
  } else {
    const i = store.findIndex((x) => x.id === lid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "lecture.delete", resource: lid })
  return true
}

export async function listLectures(): Promise<Lecture[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("guest_lectures").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
