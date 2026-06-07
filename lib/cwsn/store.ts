// VASA-EOS(SE) — CWSN / IEP register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.
// Disability data is sensitive — production restricts reads to the inclusion cell.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { CwsnStudent } from "./index"

function id(): string {
  return `CW-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  name: string
  cls: string
  disability: string
  supports: string[]
  iep_goal: string
  reviewed: boolean
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): CwsnStudent {
  return {
    id: r.id,
    name: r.name,
    cls: r.cls,
    disability: r.disability,
    supports: r.supports ?? [],
    iepGoal: r.iep_goal,
    reviewed: r.reviewed,
    tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE,
  }
}

// Seeded across tenant nodes so the inclusion cell at each tier sees its own subtree.
const store: CwsnStudent[] = [
  { id: "CW-SEED1", name: "Meena", cls: "5A", disability: "Hearing impairment", supports: ["Scribe / reader", "Extra examination time"], iepGoal: "Read 60 wpm", reviewed: false, tenantId: "TN-CHN-B1-S1" },
  { id: "CW-SEED2", name: "Arun", cls: "7B", disability: "Locomotor disability", supports: ["Assistive device"], iepGoal: "Independent mobility", reviewed: true, tenantId: "TN-CHN-B2-S1" },
  { id: "CW-SEED3", name: "Priya", cls: "3C", disability: "Autism spectrum", supports: ["Individual support"], iepGoal: "Sustained attention", reviewed: false, tenantId: "TN-CBE-B1-S1" },
]

export interface NewStudent {
  name: string
  cls: string
  disability: string
  supports: string[]
  iepGoal: string
  /** Tenant node the learner is registered at; defaults to the demo school. */
  tenantId?: string
}

export async function createStudent(input: NewStudent): Promise<CwsnStudent> {
  const st: CwsnStudent = {
    id: id(),
    name: input.name,
    cls: input.cls,
    disability: input.disability,
    supports: input.supports,
    iepGoal: input.iepGoal,
    reviewed: false,
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("cwsn_students").insert({
      id: st.id,
      name: st.name,
      cls: st.cls,
      disability: st.disability,
      supports: st.supports,
      iep_goal: st.iepGoal,
      reviewed: st.reviewed,
      tenant_id: st.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(st)
  }
  await appendAudit({ actor: "inclusion-cell", action: "cwsn.register", resource: st.id })
  return st
}

async function load(sid: string): Promise<CwsnStudent | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("cwsn_students").select("*").eq("id", sid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === sid)
}

export async function getStudent(sid: string): Promise<CwsnStudent | undefined> {
  return load(sid)
}

export async function reviewStudent(sid: string): Promise<CwsnStudent | undefined> {
  const st = await load(sid)
  if (!st) return undefined
  st.reviewed = true
  const db = getDb()
  if (db) await db.from("cwsn_students").update({ reviewed: true }).eq("id", sid)
  await appendAudit({ actor: "inclusion-cell", action: "cwsn.review", resource: sid })
  return st
}

export async function deleteStudent(sid: string): Promise<boolean> {
  const existing = await load(sid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("cwsn_students").delete().eq("id", sid)
  } else {
    const i = store.findIndex((x) => x.id === sid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "cwsn.delete", resource: sid })
  return true
}

export async function listStudents(): Promise<CwsnStudent[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("cwsn_students").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
