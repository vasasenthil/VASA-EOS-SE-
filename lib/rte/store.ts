// VASA-EOS(SE) — RTE 25% quota applicant register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { nextRteStatus, type RteApplicant } from "./index"

function id(): string {
  return `RTE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  name: string
  category: string
  status: RteApplicant["status"]
  date: string
  created_at: string
}

function fromRow(r: Row): RteApplicant {
  return { id: r.id, name: r.name, category: r.category, status: r.status, date: r.date }
}

const store: RteApplicant[] = []

export interface NewApplicant {
  name: string
  category: string
}

export async function createApplicant(input: NewApplicant): Promise<RteApplicant> {
  const a: RteApplicant = {
    id: id(),
    name: input.name,
    category: input.category,
    status: "applied",
    date: new Date().toISOString().slice(0, 10),
  }
  const db = getDb()
  if (db) {
    await db.from("rte_applicants").insert({
      id: a.id,
      name: a.name,
      category: a.category,
      status: a.status,
      date: a.date,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(a)
  }
  await appendAudit({ actor: "admissions", action: "rte.apply", resource: a.id, details: { category: a.category } })
  return a
}

async function load(aid: string): Promise<RteApplicant | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("rte_applicants").select("*").eq("id", aid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === aid)
}

export async function getApplicant(aid: string): Promise<RteApplicant | undefined> {
  return load(aid)
}

export async function advanceApplicant(aid: string): Promise<RteApplicant | undefined> {
  const a = await load(aid)
  if (!a) return undefined
  a.status = nextRteStatus(a.status)
  const db = getDb()
  if (db) await db.from("rte_applicants").update({ status: a.status }).eq("id", aid)
  await appendAudit({ actor: "admissions", action: "rte.advance", resource: aid, details: { status: a.status } })
  return a
}

export async function deleteApplicant(aid: string): Promise<boolean> {
  const existing = await load(aid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("rte_applicants").delete().eq("id", aid)
  } else {
    const i = store.findIndex((x) => x.id === aid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "rte.delete", resource: aid })
  return true
}

export async function listApplicants(): Promise<RteApplicant[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("rte_applicants").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
