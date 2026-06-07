// VASA-EOS(SE) — Guest-lecture / resource-person register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.
// Append-only records — create, list and (corrective) delete.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import type { Lecture } from "./index"

function id(): string {
  return `GL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  speaker: string
  topic: string
  org: string
  domain: string
  date: string
  audience: number
  cls: string
  created_at: string
}

function fromRow(r: Row): Lecture {
  return {
    id: r.id,
    speaker: r.speaker,
    topic: r.topic,
    org: r.org,
    domain: r.domain,
    date: r.date,
    audience: r.audience,
    cls: r.cls,
  }
}

const store: Lecture[] = []

export interface NewLecture {
  speaker: string
  topic: string
  org: string
  domain: string
  date: string
  audience: number
  cls: string
}

export async function createLecture(input: NewLecture): Promise<Lecture> {
  const l: Lecture = { id: id(), ...input }
  const db = getDb()
  if (db) {
    await db.from("guest_lectures").insert({
      id: l.id,
      speaker: l.speaker,
      topic: l.topic,
      org: l.org,
      domain: l.domain,
      date: l.date,
      audience: l.audience,
      cls: l.cls,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(l)
  }
  await appendAudit({ actor: "school", action: "lecture.log", resource: l.id, details: { domain: l.domain } })
  return l
}

async function load(lid: string): Promise<Lecture | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("guest_lectures").select("*").eq("id", lid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === lid)
}

export async function getLecture(lid: string): Promise<Lecture | undefined> {
  return load(lid)
}

export async function deleteLecture(lid: string): Promise<boolean> {
  const existing = await load(lid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("guest_lectures").delete().eq("id", lid)
  } else {
    const i = store.findIndex((x) => x.id === lid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "lecture.delete", resource: lid })
  return true
}

export async function listLectures(): Promise<Lecture[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("guest_lectures").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
