// VASA-EOS(SE) — Science-exhibition / INSPIRE project register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import type { SfProject } from "./index"

function id(): string {
  return `SF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  title: string
  student: string
  cls: string
  category: string
  score: number
  judged: boolean
  created_at: string
}

function fromRow(r: Row): SfProject {
  return {
    id: r.id,
    title: r.title,
    student: r.student,
    cls: r.cls,
    category: r.category,
    score: r.score,
    judged: r.judged,
  }
}

const store: SfProject[] = []

export interface NewProject {
  title: string
  student: string
  cls: string
  category: string
}

export async function createProject(input: NewProject): Promise<SfProject> {
  const p: SfProject = {
    id: id(),
    title: input.title,
    student: input.student,
    cls: input.cls,
    category: input.category,
    score: 0,
    judged: false,
  }
  const db = getDb()
  if (db) {
    await db.from("sf_projects").insert({
      id: p.id,
      title: p.title,
      student: p.student,
      cls: p.cls,
      category: p.category,
      score: p.score,
      judged: p.judged,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(p)
  }
  await appendAudit({ actor: "science", action: "sf.register", resource: p.id })
  return p
}

async function load(pid: string): Promise<SfProject | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("sf_projects").select("*").eq("id", pid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === pid)
}

export async function getProject(pid: string): Promise<SfProject | undefined> {
  return load(pid)
}

/** Record a judge's score (clamped 0–100) and mark the project judged. */
export async function scoreProject(pid: string, score: number): Promise<SfProject | undefined> {
  const p = await load(pid)
  if (!p) return undefined
  p.score = Math.max(0, Math.min(100, Math.round(score)))
  p.judged = true
  const db = getDb()
  if (db) await db.from("sf_projects").update({ score: p.score, judged: true }).eq("id", pid)
  await appendAudit({ actor: "science", action: "sf.score", resource: pid, details: { score: p.score } })
  return p
}

export async function deleteProject(pid: string): Promise<boolean> {
  const existing = await load(pid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("sf_projects").delete().eq("id", pid)
  } else {
    const i = store.findIndex((x) => x.id === pid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "sf.delete", resource: pid })
  return true
}

export async function listProjects(): Promise<SfProject[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("sf_projects").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
