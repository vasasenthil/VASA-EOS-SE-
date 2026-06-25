// VASA-EOS(SE) — Federation reconciliation log persistence (server-only). Full CRUD.
// Durable in Supabase when configured; in-memory seeded fallback otherwise. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { FederationLog, LogInput } from "./index"

function id(): string {
  return `FED-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  source: string
  source_label: string
  key: string
  summary: string
  mode: string
  status: string
  reconciled_by: string
  notes: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function fromRow(r: Row): FederationLog {
  return {
    id: r.id, source: r.source, sourceLabel: r.source_label, key: r.key, summary: r.summary ?? "", mode: r.mode ?? "mock",
    status: (r.status as FederationLog["status"]) ?? "Pending", reconciledBy: r.reconciled_by ?? "", notes: r.notes ?? "", createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(l: FederationLog, tenantId: string): Row {
  return {
    id: l.id, source: l.source, source_label: l.sourceLabel, key: l.key, summary: l.summary, mode: l.mode, status: l.status,
    reconciled_by: l.reconciledBy, notes: l.notes, tenant_id: tenantId, created_at: l.createdAt, updated_at: l.updatedAt,
  }
}

function seed(): FederationLog[] {
  const now = "2026-06-20T00:00:00.000Z"
  const mk = (i: number, source: string, label: string, key: string, summary: string, status: FederationLog["status"], by: string): FederationLog => ({
    id: `demo-fed-${i}`, source, sourceLabel: label, key, summary, mode: "mock", status, reconciledBy: by, notes: "", createdAt: now, updatedAt: now,
  })
  return [
    mk(1, "apaar", "APAAR (Learner ID)", "APAAR-100200300401", "Aarthi M. · enrolled · UDISE 33010100101", "Reconciled", "BEO Egmore"),
    mk(2, "udise", "UDISE+ (School registry)", "33010100102", "GGHSS Egmore · Chennai · State (TN SCERT)", "Pending", ""),
    mk(3, "pfms", "PFMS / DBT (Fund flow)", "PUDHUMAI-PENN", "Allocated ₹5.4 Cr · released ₹4.0 Cr · utilised ₹3.6 Cr", "Flagged", "DEO Chennai"),
  ]
}

const store: FederationLog[] = seed()

export async function listLogs(): Promise<FederationLog[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("federation_logs").select("*").order("created_at", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getLog(lid: string): Promise<FederationLog | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("federation_logs").select("*").eq("id", lid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((l) => l.id === lid)
  }
  return store.find((l) => l.id === lid)
}

export async function createLog(input: LogInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<FederationLog> {
  const now = new Date().toISOString()
  const l: FederationLog = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("federation_logs").insert(toRow(l, tenantId))
  else store.unshift(l)
  await appendAudit({ actor: "federation", action: "federation.lookup", resource: l.id, details: { source: l.source, key: l.key, mode: l.mode } })
  return l
}

export async function updateLog(lid: string, input: LogInput): Promise<FederationLog | undefined> {
  const existing = await getLog(lid)
  if (!existing) return undefined
  const updated: FederationLog = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("federation_logs").update({ status: updated.status, reconciled_by: updated.reconciledBy, notes: updated.notes, updated_at: updated.updatedAt }).eq("id", lid)
  } else {
    const i = store.findIndex((l) => l.id === lid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "federation", action: "federation.reconcile", resource: lid, details: { status: updated.status } })
  return updated
}

export async function deleteLog(lid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("federation_logs").delete().eq("id", lid)
  } else {
    const i = store.findIndex((l) => l.id === lid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "federation", action: "federation.delete", resource: lid })
  return true
}

export async function seedLogs(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const l of rows) await db.from("federation_logs").upsert(toRow(l, tenantId))
  } else {
    for (const l of rows) if (!store.some((s) => s.id === l.id)) store.push(l)
  }
  await appendAudit({ actor: "federation", action: "federation.seed", resource: "federation_logs", details: { count: rows.length } })
  return rows.length
}
