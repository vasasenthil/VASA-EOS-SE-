// VASA-EOS(SE) — Transfer Certificate (TC) register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Every issue
// stamps a sequential TC number; all mutations are audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { nextTcStatus, tcNumber, type TcRequest } from "./index"

function id(): string {
  return `TCR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  student: string
  cls: string
  reason: string
  status: TcRequest["status"]
  date: string
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): TcRequest {
  return { id: r.id, student: r.student, cls: r.cls, reason: r.reason, status: r.status, date: r.date, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

// Seeded across tenant nodes so TC issuance rolls up by jurisdiction.
const store: TcRequest[] = [
  { id: "TCR-SEED1", student: "Arjun M", cls: "10-A", reason: "Relocation / family transfer", status: "verified", date: "2026-05-22", tenantId: "TN-CHN-B1-S1" },
  { id: "TCR-SEED2", student: "Sneha P", cls: "8-B", reason: "Completed final grade", status: "issued", date: "2026-05-10", tenantId: "TN-CHN-B2-S1" },
  { id: "TCR-SEED3", student: "Bala K", cls: "6-C", reason: "Migration (inter-state)", status: "requested", date: "2026-06-02", tenantId: "TN-CBE-B1-S1" },
]

export interface NewTc {
  student: string
  cls: string
  reason: string
  /** Tenant node the request is filed at; defaults to the demo school. */
  tenantId?: string
}

export async function createTc(input: NewTc): Promise<TcRequest> {
  const t: TcRequest = {
    id: id(),
    student: input.student,
    cls: input.cls,
    reason: input.reason,
    status: "requested",
    date: new Date().toISOString().slice(0, 10),
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("tc_requests").insert({
      id: t.id,
      student: t.student,
      cls: t.cls,
      reason: t.reason,
      status: t.status,
      date: t.date,
      tenant_id: t.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(t)
  }
  await appendAudit({ actor: "office", action: "tc.request", resource: t.id, details: { student: t.student } })
  return t
}

async function load(tid: string): Promise<TcRequest | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("tc_requests").select("*").eq("id", tid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === tid)
}

export async function getTc(tid: string): Promise<TcRequest | undefined> {
  return load(tid)
}

export async function advanceTc(tid: string): Promise<TcRequest | undefined> {
  const t = await load(tid)
  if (!t) return undefined
  const next = nextTcStatus(t.status)
  // Stamp a sequential TC number the moment it is issued.
  if (next === "issued" && t.status !== "issued") {
    const issued = (await listTc()).filter((x) => x.status === "issued").length
    t.reason = `${t.reason} · ${tcNumber(new Date().getFullYear(), issued + 1)}`
  }
  t.status = next
  const db = getDb()
  if (db) await db.from("tc_requests").update({ status: t.status, reason: t.reason }).eq("id", tid)
  await appendAudit({ actor: "office", action: "tc.advance", resource: tid, details: { status: t.status } })
  return t
}

export async function deleteTc(tid: string): Promise<boolean> {
  const existing = await load(tid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("tc_requests").delete().eq("id", tid)
  } else {
    const i = store.findIndex((x) => x.id === tid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "tc.delete", resource: tid })
  return true
}

export async function listTc(): Promise<TcRequest[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("tc_requests").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
