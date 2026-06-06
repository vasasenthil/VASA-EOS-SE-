// VASA-EOS(SE) — Bagless-days / experiential-learning log persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.
// Append-only records — create, list and (corrective) delete.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import type { BaglessActivity } from "./index"

function id(): string {
  return `BL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  title: string
  type: string
  date: string
  class_group: string
  participants: number
  created_at: string
}

function fromRow(r: Row): BaglessActivity {
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    date: r.date,
    classGroup: r.class_group,
    participants: r.participants,
  }
}

const store: BaglessActivity[] = []

export interface NewActivity {
  title: string
  type: string
  date: string
  classGroup: string
  participants: number
}

export async function createActivity(input: NewActivity): Promise<BaglessActivity> {
  const a: BaglessActivity = {
    id: id(),
    title: input.title,
    type: input.type,
    date: input.date,
    classGroup: input.classGroup,
    participants: input.participants,
  }
  const db = getDb()
  if (db) {
    await db.from("bagless_activities").insert({
      id: a.id,
      title: a.title,
      type: a.type,
      date: a.date,
      class_group: a.classGroup,
      participants: a.participants,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(a)
  }
  await appendAudit({ actor: "teacher", action: "bagless.log", resource: a.id, details: { type: a.type } })
  return a
}

async function load(aid: string): Promise<BaglessActivity | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("bagless_activities").select("*").eq("id", aid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === aid)
}

export async function getActivity(aid: string): Promise<BaglessActivity | undefined> {
  return load(aid)
}

export async function deleteActivity(aid: string): Promise<boolean> {
  const existing = await load(aid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("bagless_activities").delete().eq("id", aid)
  } else {
    const i = store.findIndex((x) => x.id === aid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "bagless.delete", resource: aid })
  return true
}

export async function listActivities(): Promise<BaglessActivity[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("bagless_activities").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
