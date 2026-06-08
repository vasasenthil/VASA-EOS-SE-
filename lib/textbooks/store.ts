// VASA-EOS(SE) — Textbook indent / book-bank register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { Indent } from "./index"

function id(): string {
  return `TB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  cls: string
  subject: string
  required: number
  received: number
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): Indent {
  return { id: r.id, cls: r.cls, subject: r.subject, required: r.required, received: r.received, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

// Seeded across tenant nodes so textbook indents roll up by jurisdiction.
const store: Indent[] = [
  { id: "TB-SEED1", cls: "9", subject: "Science", required: 240, received: 240, tenantId: "TN-CHN-B1-S1" },
  { id: "TB-SEED2", cls: "10", subject: "Mathematics", required: 300, received: 180, tenantId: "TN-CHN-B2-S1" },
  { id: "TB-SEED3", cls: "8", subject: "Tamil", required: 210, received: 0, tenantId: "TN-CBE-B1-S1" },
]

export interface NewIndent {
  cls: string
  subject: string
  required: number
  /** Tenant node the indent is raised at; defaults to the demo school. */
  tenantId?: string
}

export async function createIndent(input: NewIndent): Promise<Indent> {
  const it: Indent = { id: id(), cls: input.cls, subject: input.subject, required: input.required, received: 0, tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE }
  const db = getDb()
  if (db) {
    await db.from("textbook_indents").insert({
      id: it.id,
      cls: it.cls,
      subject: it.subject,
      required: it.required,
      received: it.received,
      tenant_id: it.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(it)
  }
  await appendAudit({ actor: "store", action: "textbook.indent", resource: it.id, details: { required: it.required } })
  return it
}

async function load(iid: string): Promise<Indent | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("textbook_indents").select("*").eq("id", iid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === iid)
}

export async function getIndent(iid: string): Promise<Indent | undefined> {
  return load(iid)
}

/** Record received copies (never below 0 or above required). */
export async function receiveCopies(iid: string, qty: number): Promise<Indent | undefined> {
  const it = await load(iid)
  if (!it) return undefined
  it.received = Math.max(0, Math.min(it.required, it.received + qty))
  const db = getDb()
  if (db) await db.from("textbook_indents").update({ received: it.received }).eq("id", iid)
  await appendAudit({ actor: "store", action: "textbook.receive", resource: iid, details: { received: it.received } })
  return it
}

export async function deleteIndent(iid: string): Promise<boolean> {
  const existing = await load(iid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("textbook_indents").delete().eq("id", iid)
  } else {
    const i = store.findIndex((x) => x.id === iid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "textbook.delete", resource: iid })
  return true
}

export async function listIndents(): Promise<Indent[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("textbook_indents").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
