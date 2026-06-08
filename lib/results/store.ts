// VASA-EOS(SE) — Result publication snapshots (server-only).
// The board computes per-student results live; this persists a dated PUBLICATION
// record (exam, candidates, pass %). Durable in Supabase when configured;
// in-memory otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"

function id(): string {
  return `RP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export interface ResultPublication {
  id: string
  date: string
  examName: string
  candidates: number
  passPct: number
  /** Tenant node that produced this snapshot — drives per-role data scoping. */
  tenantId: string
}

interface Row {
  id: string
  date: string
  exam_name: string
  candidates: number
  pass_pct: number
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): ResultPublication {
  return { id: r.id, date: r.date, examName: r.exam_name, candidates: r.candidates, passPct: r.pass_pct, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

const store: ResultPublication[] = []

export interface NewPublication {
  examName: string
  candidates: number
  passPct: number
  /** Producing tenant node; defaults to the demo school. */
  tenantId?: string
}

export async function publishResults(input: NewPublication): Promise<ResultPublication> {
  const p: ResultPublication = {
    id: id(),
    date: new Date().toISOString().slice(0, 10),
    examName: input.examName,
    candidates: input.candidates,
    passPct: input.passPct,
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("result_publications").insert({
      id: p.id,
      date: p.date,
      exam_name: p.examName,
      candidates: p.candidates,
      pass_pct: p.passPct,
      tenant_id: p.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(p)
  }
  await appendAudit({ actor: "exams", action: "results.publish", resource: p.id, details: { exam: p.examName, passPct: p.passPct } })
  return p
}

async function load(pid: string): Promise<ResultPublication | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("result_publications").select("*").eq("id", pid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === pid)
}

export async function getPublication(pid: string): Promise<ResultPublication | undefined> {
  return load(pid)
}

export async function deletePublication(pid: string): Promise<boolean> {
  const existing = await load(pid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("result_publications").delete().eq("id", pid)
  } else {
    const i = store.findIndex((x) => x.id === pid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "results.delete", resource: pid })
  return true
}

export async function listPublications(): Promise<ResultPublication[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("result_publications").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
