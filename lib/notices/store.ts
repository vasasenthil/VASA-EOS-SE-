// VASA-EOS(SE) — Notice board / circulars persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { newNoticeId, SAMPLE_NOTICES, type Notice, type NoticeAudience, type NoticeCategory } from "./index"

interface Row {
  id: string
  title: string
  body: string
  category: NoticeCategory
  audience: NoticeAudience
  date: string
  pinned: boolean
  created_at: string
}

function fromRow(r: Row): Notice {
  return { id: r.id, title: r.title, body: r.body, category: r.category, audience: r.audience, date: r.date, pinned: r.pinned }
}

// In-memory fallback seeded with the sample board so the demo shows content.
const store: Notice[] = [...SAMPLE_NOTICES]

export interface NewNotice {
  title: string
  body: string
  category: NoticeCategory
  audience: NoticeAudience
}

export async function publishNotice(input: NewNotice): Promise<Notice> {
  const n: Notice = {
    id: newNoticeId(),
    title: input.title,
    body: input.body,
    category: input.category,
    audience: input.audience,
    date: new Date().toISOString().slice(0, 10),
    pinned: input.category === "Urgent",
  }
  const db = getDb()
  if (db) {
    await db.from("notices").insert({
      id: n.id,
      title: n.title,
      body: n.body,
      category: n.category,
      audience: n.audience,
      date: n.date,
      pinned: n.pinned,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(n)
  }
  await appendAudit({ actor: "office", action: "notice.publish", resource: n.id, details: { category: n.category } })
  return n
}

async function load(nid: string): Promise<Notice | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("notices").select("*").eq("id", nid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === nid)
}

export async function getNotice(nid: string): Promise<Notice | undefined> {
  return load(nid)
}

export async function setPinned(nid: string, pinned: boolean): Promise<Notice | undefined> {
  const n = await load(nid)
  if (!n) return undefined
  n.pinned = pinned
  const db = getDb()
  if (db) await db.from("notices").update({ pinned }).eq("id", nid)
  await appendAudit({ actor: "office", action: "notice.pin", resource: nid, details: { pinned } })
  return n
}

export async function deleteNotice(nid: string): Promise<boolean> {
  const existing = await load(nid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("notices").delete().eq("id", nid)
  } else {
    const i = store.findIndex((x) => x.id === nid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "notice.delete", resource: nid })
  return true
}

export async function listNotices(): Promise<Notice[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("notices").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
