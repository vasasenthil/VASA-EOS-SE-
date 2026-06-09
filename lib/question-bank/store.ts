// VASA-EOS(SE) — Question-paper saved snapshots (server-only).
// The board assembles a paper from the bank live; this persists a SNAPSHOT (title +
// the chosen question ids + count + total marks). Durable in Supabase when
// configured; in-memory otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"

function id(): string {
  return `PAP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export interface PaperSnapshot {
  id: string
  title: string
  questionIds: string[]
  count: number
  totalMarks: number
  /** Tenant node that produced this paper — drives per-role data scoping. */
  tenantId: string
}

interface Row {
  id: string
  title: string
  question_ids: string[]
  count: number
  total_marks: number
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): PaperSnapshot {
  return { id: r.id, title: r.title, questionIds: r.question_ids ?? [], count: r.count, totalMarks: r.total_marks, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

const store: PaperSnapshot[] = []

export interface NewPaper {
  title: string
  questionIds: string[]
  totalMarks: number
  /** Producing tenant node; defaults to the demo school. */
  tenantId?: string
}

export async function savePaper(input: NewPaper): Promise<PaperSnapshot> {
  const p: PaperSnapshot = { id: id(), title: input.title, questionIds: input.questionIds, count: input.questionIds.length, totalMarks: input.totalMarks, tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE }
  const db = getDb()
  if (db) {
    await db.from("question_papers").insert({ id: p.id, title: p.title, question_ids: p.questionIds, count: p.count, total_marks: p.totalMarks, tenant_id: p.tenantId, created_at: new Date().toISOString() })
  } else {
    store.unshift(p)
  }
  await appendAudit({ actor: "assessment", action: "paper.save", resource: p.id, details: { totalMarks: p.totalMarks } })
  return p
}

export async function listPapers(): Promise<PaperSnapshot[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("question_papers").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
