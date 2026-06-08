// VASA-EOS(SE) — Teacher vacancy / rationalisation register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { PostLine } from "./index"

function id(): string {
  return `PL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  subject: string
  sanctioned: number
  working: number
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): PostLine {
  return { id: r.id, subject: r.subject, sanctioned: r.sanctioned, working: r.working, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

// Seeded across tenant nodes so vacancy/rationalisation rolls up by jurisdiction.
const store: PostLine[] = [
  { id: "PL-SEED1", subject: "Graduate (BT Assistant)", sanctioned: 12, working: 10, tenantId: "TN-CHN-B1-S1" },
  { id: "PL-SEED2", subject: "Post-Graduate (PG Assistant)", sanctioned: 8, working: 8, tenantId: "TN-CHN-B2-S1" },
  { id: "PL-SEED3", subject: "Physical Education", sanctioned: 2, working: 1, tenantId: "TN-CBE-B1-S1" },
]

export interface NewLine {
  subject: string
  sanctioned: number
  working: number
  /** Tenant node the post line belongs to; defaults to the demo school. */
  tenantId?: string
}

export async function createLine(input: NewLine): Promise<PostLine> {
  const l: PostLine = { id: id(), subject: input.subject, sanctioned: input.sanctioned, working: input.working, tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE }
  const db = getDb()
  if (db) {
    await db.from("vacancy_lines").insert({
      id: l.id,
      subject: l.subject,
      sanctioned: l.sanctioned,
      working: l.working,
      tenant_id: l.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(l)
  }
  await appendAudit({ actor: "hr", action: "vacancy.add", resource: l.id, details: { subject: l.subject } })
  return l
}

async function load(lid: string): Promise<PostLine | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("vacancy_lines").select("*").eq("id", lid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === lid)
}

export async function getLine(lid: string): Promise<PostLine | undefined> {
  return load(lid)
}

export async function deleteLine(lid: string): Promise<boolean> {
  const existing = await load(lid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("vacancy_lines").delete().eq("id", lid)
  } else {
    const i = store.findIndex((x) => x.id === lid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "vacancy.delete", resource: lid })
  return true
}

export async function listLines(): Promise<PostLine[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("vacancy_lines").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
