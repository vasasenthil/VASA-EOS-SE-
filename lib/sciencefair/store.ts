// VASA-EOS(SE) — Science-exhibition / INSPIRE project register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
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
  tenant_id: string
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
    tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE,
  }
}

// Seeded across tenant nodes so science projects roll up by jurisdiction.
const store: SfProject[] = [
  { id: "SF-SEED1", title: "Solar water purifier", student: "Nila", cls: "9-A", category: "Environment", score: 82, judged: true, tenantId: "TN-CHN-B1-S1" },
  { id: "SF-SEED2", title: "Smart dustbin", student: "Vikram", cls: "10-B", category: "Robotics / IoT", score: 0, judged: false, tenantId: "TN-CHN-B2-S1" },
  { id: "SF-SEED3", title: "Rainwater pH study", student: "Iniya", cls: "8-C", category: "Chemistry", score: 68, judged: true, tenantId: "TN-CBE-B1-S1" },
]

export interface NewProject {
  title: string
  student: string
  cls: string
  category: string
  /** Tenant node the project is registered at; defaults to the demo school. */
  tenantId?: string
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
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
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
      tenant_id: p.tenantId,
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
