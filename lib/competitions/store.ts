// VASA-EOS(SE) — Olympiad & competition results persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { CompEntry, Medal } from "./index"

function id(): string {
  return `CP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  student: string
  event: string
  level: string
  medal: Medal
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): CompEntry {
  return { id: r.id, student: r.student, event: r.event, level: r.level, medal: r.medal, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

// Seeded across tenant nodes so achievements roll up by jurisdiction.
const store: CompEntry[] = [
  { id: "CP-SEED1", student: "Nila", event: "Science Olympiad", level: "State", medal: "Gold", tenantId: "TN-CHN-B1-S1" },
  { id: "CP-SEED2", student: "Vikram", event: "Maths Quiz", level: "District", medal: "Silver", tenantId: "TN-CHN-B2-S1" },
  { id: "CP-SEED3", student: "Iniya", event: "Essay", level: "Block", medal: "Participation", tenantId: "TN-CBE-B1-S1" },
]

export interface NewEntry {
  student: string
  event: string
  level: string
  medal: Medal
  /** Tenant node the entry is recorded at; defaults to the demo school. */
  tenantId?: string
}

export async function createEntry(input: NewEntry): Promise<CompEntry> {
  const e: CompEntry = { id: id(), student: input.student, event: input.event, level: input.level, medal: input.medal, tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE }
  const db = getDb()
  if (db) {
    await db.from("competition_entries").insert({
      id: e.id,
      student: e.student,
      event: e.event,
      level: e.level,
      medal: e.medal,
      tenant_id: e.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(e)
  }
  await appendAudit({ actor: "teacher", action: "competition.record", resource: e.id, details: { medal: e.medal } })
  return e
}

async function load(eid: string): Promise<CompEntry | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("competition_entries").select("*").eq("id", eid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === eid)
}

export async function getEntry(eid: string): Promise<CompEntry | undefined> {
  return load(eid)
}

export async function deleteEntry(eid: string): Promise<boolean> {
  const existing = await load(eid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("competition_entries").delete().eq("id", eid)
  } else {
    const i = store.findIndex((x) => x.id === eid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "competition.delete", resource: eid })
  return true
}

export async function listEntries(): Promise<CompEntry[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("competition_entries").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
