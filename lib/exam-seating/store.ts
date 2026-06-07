// VASA-EOS(SE) — Exam seating saved-plan snapshots (server-only).
// The planner computes hall allocation live; this persists a dated SNAPSHOT of a
// plan (candidates + seated/unseated). Durable in Supabase when configured; in-memory
// otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"

function id(): string {
  return `ESP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export interface SeatingSnapshot {
  id: string
  label: string
  candidates: number
  seated: number
  unseated: number
}

interface Row {
  id: string
  label: string
  candidates: number
  seated: number
  unseated: number
  created_at: string
}

function fromRow(r: Row): SeatingSnapshot {
  return { id: r.id, label: r.label, candidates: r.candidates, seated: r.seated, unseated: r.unseated }
}

const store: SeatingSnapshot[] = []

export interface NewSeating {
  label: string
  candidates: number
  seated: number
  unseated: number
}

export async function savePlan(input: NewSeating): Promise<SeatingSnapshot> {
  const p: SeatingSnapshot = { id: id(), ...input }
  const db = getDb()
  if (db) {
    await db.from("seating_plans").insert({ id: p.id, label: p.label, candidates: p.candidates, seated: p.seated, unseated: p.unseated, created_at: new Date().toISOString() })
  } else {
    store.unshift(p)
  }
  await appendAudit({ actor: "exams", action: "seating.save", resource: p.id, details: { candidates: p.candidates } })
  return p
}

export async function listPlans(): Promise<SeatingSnapshot[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("seating_plans").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
