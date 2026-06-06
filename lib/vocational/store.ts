// VASA-EOS(SE) — Vocational / NSQF enrolment register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import type { VocEnrolment } from "./index"

function id(): string {
  return `VC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  student: string
  trade: string
  level: number
  certified: boolean
  created_at: string
}

function fromRow(r: Row): VocEnrolment {
  return { id: r.id, student: r.student, trade: r.trade, level: r.level, certified: r.certified }
}

const store: VocEnrolment[] = []

export interface NewEnrolment {
  student: string
  trade: string
  level: number
}

export async function createEnrolment(input: NewEnrolment): Promise<VocEnrolment> {
  const e: VocEnrolment = { id: id(), student: input.student, trade: input.trade, level: input.level, certified: false }
  const db = getDb()
  if (db) {
    await db.from("voc_enrolments").insert({
      id: e.id,
      student: e.student,
      trade: e.trade,
      level: e.level,
      certified: e.certified,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(e)
  }
  await appendAudit({ actor: "vocational", action: "voc.enrol", resource: e.id, details: { trade: e.trade } })
  return e
}

async function load(eid: string): Promise<VocEnrolment | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("voc_enrolments").select("*").eq("id", eid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === eid)
}

export async function getEnrolment(eid: string): Promise<VocEnrolment | undefined> {
  return load(eid)
}

export async function certifyEnrolment(eid: string): Promise<VocEnrolment | undefined> {
  const e = await load(eid)
  if (!e) return undefined
  e.certified = true
  const db = getDb()
  if (db) await db.from("voc_enrolments").update({ certified: true }).eq("id", eid)
  await appendAudit({ actor: "vocational", action: "voc.certify", resource: eid })
  return e
}

export async function deleteEnrolment(eid: string): Promise<boolean> {
  const existing = await load(eid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("voc_enrolments").delete().eq("id", eid)
  } else {
    const i = store.findIndex((x) => x.id === eid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "voc.delete", resource: eid })
  return true
}

export async function listEnrolments(): Promise<VocEnrolment[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("voc_enrolments").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
