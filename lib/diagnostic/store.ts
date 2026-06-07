// VASA-EOS(SE) — Diagnostic / learning-level saved rounds (server-only).
// The board computes levels from scores live; this persists a dated SNAPSHOT of a
// diagnostic round (the scores + the class summary). Durable in Supabase when
// configured; in-memory otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import type { DiagSummary } from "./index"

function id(): string {
  return `DG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export interface DiagRound {
  id: string
  date: string
  label: string
  scores: Record<string, number>
  summary: DiagSummary
}

interface Row {
  id: string
  date: string
  label: string
  scores: Record<string, number>
  summary: DiagSummary
  created_at: string
}

function fromRow(r: Row): DiagRound {
  return { id: r.id, date: r.date, label: r.label, scores: r.scores, summary: r.summary }
}

const store: DiagRound[] = []

export interface NewRound {
  date: string
  label: string
  scores: Record<string, number>
  summary: DiagSummary
}

export async function saveRound(input: NewRound): Promise<DiagRound> {
  const r: DiagRound = { id: id(), date: input.date, label: input.label, scores: input.scores, summary: input.summary }
  const db = getDb()
  if (db) {
    await db.from("diagnostic_rounds").insert({
      id: r.id,
      date: r.date,
      label: r.label,
      scores: r.scores,
      summary: r.summary,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(r)
  }
  await appendAudit({ actor: "teacher", action: "diagnostic.save", resource: r.id, details: { avgScore: r.summary.avgScore } })
  return r
}

async function load(rid: string): Promise<DiagRound | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("diagnostic_rounds").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getRound(rid: string): Promise<DiagRound | undefined> {
  return load(rid)
}

export async function deleteRound(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("diagnostic_rounds").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "diagnostic.delete", resource: rid })
  return true
}

export async function listRounds(): Promise<DiagRound[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("diagnostic_rounds").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
