// VASA-EOS(SE) — Khelo India fitness-test register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.
// Grade is derived server-side from the score so it can't be falsified client-side.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { gradeFor, type FitnessRecord } from "./index"

function id(): string {
  return `FT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  student: string
  cls: string
  test: string
  score: number
  grade: FitnessRecord["grade"]
  created_at: string
}

function fromRow(r: Row): FitnessRecord {
  return { id: r.id, student: r.student, cls: r.cls, test: r.test, score: r.score, grade: r.grade }
}

const store: FitnessRecord[] = []

export interface NewRecord {
  student: string
  cls: string
  test: string
  score: number
}

export async function createRecord(input: NewRecord): Promise<FitnessRecord> {
  const r: FitnessRecord = {
    id: id(),
    student: input.student,
    cls: input.cls,
    test: input.test,
    score: input.score,
    grade: gradeFor(input.score),
  }
  const db = getDb()
  if (db) {
    await db.from("fitness_records").insert({
      id: r.id,
      student: r.student,
      cls: r.cls,
      test: r.test,
      score: r.score,
      grade: r.grade,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(r)
  }
  await appendAudit({ actor: "pe", action: "fitness.record", resource: r.id, details: { grade: r.grade } })
  return r
}

async function load(rid: string): Promise<FitnessRecord | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("fitness_records").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getRecord(rid: string): Promise<FitnessRecord | undefined> {
  return load(rid)
}

export async function deleteRecord(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("fitness_records").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "fitness.delete", resource: rid })
  return true
}

export async function listRecords(): Promise<FitnessRecord[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("fitness_records").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
