// VASA-EOS(SE) — Morning-assembly / Bal Sabha log persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.
// Append-only records — create, list and (corrective) delete.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import type { Assembly } from "./index"

function id(): string {
  return `AS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  date: string
  cls: string
  theme: string
  conducted_by: string
  thought: string
  created_at: string
}

function fromRow(r: Row): Assembly {
  return { id: r.id, date: r.date, cls: r.cls, theme: r.theme, conductedBy: r.conducted_by, thought: r.thought }
}

const store: Assembly[] = []

export interface NewAssembly {
  date: string
  cls: string
  theme: string
  conductedBy: string
  thought: string
}

export async function createAssembly(input: NewAssembly): Promise<Assembly> {
  const a: Assembly = {
    id: id(),
    date: input.date,
    cls: input.cls,
    theme: input.theme,
    conductedBy: input.conductedBy,
    thought: input.thought,
  }
  const db = getDb()
  if (db) {
    await db.from("assemblies").insert({
      id: a.id,
      date: a.date,
      cls: a.cls,
      theme: a.theme,
      conducted_by: a.conductedBy,
      thought: a.thought,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(a)
  }
  await appendAudit({ actor: "school", action: "assembly.log", resource: a.id, details: { theme: a.theme } })
  return a
}

async function load(aid: string): Promise<Assembly | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("assemblies").select("*").eq("id", aid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === aid)
}

export async function getAssembly(aid: string): Promise<Assembly | undefined> {
  return load(aid)
}

export async function deleteAssembly(aid: string): Promise<boolean> {
  const existing = await load(aid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("assemblies").delete().eq("id", aid)
  } else {
    const i = store.findIndex((x) => x.id === aid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "assembly.delete", resource: aid })
  return true
}

export async function listAssemblies(): Promise<Assembly[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("assemblies").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
