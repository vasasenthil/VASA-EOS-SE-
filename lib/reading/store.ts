// VASA-EOS(SE) — Reading-campaign / FLN level register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { nextReadingLevel, type Reader } from "./index"

function id(): string {
  return `RD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  student: string
  cls: string
  level: Reader["level"]
  books_read: number
  created_at: string
}

function fromRow(r: Row): Reader {
  return { id: r.id, student: r.student, cls: r.cls, level: r.level, booksRead: r.books_read }
}

const store: Reader[] = []

export interface NewReader {
  student: string
  cls: string
  level: Reader["level"]
}

export async function createReader(input: NewReader): Promise<Reader> {
  const r: Reader = { id: id(), student: input.student, cls: input.cls, level: input.level, booksRead: 0 }
  const db = getDb()
  if (db) {
    await db.from("readers").insert({
      id: r.id,
      student: r.student,
      cls: r.cls,
      level: r.level,
      books_read: r.booksRead,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(r)
  }
  await appendAudit({ actor: "fln", action: "reading.add", resource: r.id, details: { level: r.level } })
  return r
}

async function load(rid: string): Promise<Reader | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("readers").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getReader(rid: string): Promise<Reader | undefined> {
  return load(rid)
}

export async function promoteReader(rid: string): Promise<Reader | undefined> {
  const r = await load(rid)
  if (!r) return undefined
  r.level = nextReadingLevel(r.level)
  const db = getDb()
  if (db) await db.from("readers").update({ level: r.level }).eq("id", rid)
  await appendAudit({ actor: "fln", action: "reading.promote", resource: rid, details: { level: r.level } })
  return r
}

export async function logBook(rid: string): Promise<Reader | undefined> {
  const r = await load(rid)
  if (!r) return undefined
  r.booksRead += 1
  const db = getDb()
  if (db) await db.from("readers").update({ books_read: r.booksRead }).eq("id", rid)
  await appendAudit({ actor: "fln", action: "reading.book", resource: rid, details: { booksRead: r.booksRead } })
  return r
}

export async function deleteReader(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("readers").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "reading.delete", resource: rid })
  return true
}

export async function listReaders(): Promise<Reader[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("readers").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
