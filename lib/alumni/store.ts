// VASA-EOS(SE) — Alumni registry persistence (server-only).
// Durable in Supabase when configured; in-memory fallback (seeded with the demo
// sample) otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { newAlumniId, SAMPLE_ALUMNI, type Alumnus } from "./index"

interface Row {
  id: string
  name: string
  batch_year: number
  occupation: string
  contact: string
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): Alumnus {
  return { id: r.id, name: r.name, batchYear: r.batch_year, occupation: r.occupation, contact: r.contact, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

const store: Alumnus[] = SAMPLE_ALUMNI.map((a) => ({ ...a }))

export interface NewAlumnus {
  name: string
  batchYear: number
  occupation: string
  contact: string
  /** Tenant node (alma-mater school); defaults to the demo school. */
  tenantId?: string
}

export async function registerAlumnus(input: NewAlumnus): Promise<Alumnus> {
  const a: Alumnus = { id: newAlumniId(), name: input.name, batchYear: input.batchYear, occupation: input.occupation, contact: input.contact, tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE }
  const db = getDb()
  if (db) {
    await db.from("alumni").insert({
      id: a.id,
      name: a.name,
      batch_year: a.batchYear,
      occupation: a.occupation,
      contact: a.contact,
      tenant_id: a.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(a)
  }
  await appendAudit({ actor: "alumni-cell", action: "alumni.register", resource: a.id, details: { batchYear: a.batchYear } })
  return a
}

async function load(aid: string): Promise<Alumnus | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("alumni").select("*").eq("id", aid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === aid)
}

export async function getAlumnus(aid: string): Promise<Alumnus | undefined> {
  return load(aid)
}

export async function deleteAlumnus(aid: string): Promise<boolean> {
  const existing = await load(aid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("alumni").delete().eq("id", aid)
  } else {
    const i = store.findIndex((x) => x.id === aid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "alumni.delete", resource: aid })
  return true
}

export async function listAlumni(): Promise<Alumnus[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("alumni").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
