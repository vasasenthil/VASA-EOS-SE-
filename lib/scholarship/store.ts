// VASA-EOS(SE) — Scholarship disbursement pipeline persistence (server-only).
// Durable in Supabase when configured; in-memory fallback (seeded with the demo
// ledger) otherwise. eligible → applied → sanctioned → disbursed. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { nextStatus, SCHOLARSHIP_LEDGER, type ScholarRow } from "./index"

function id(): string {
  return `SCH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  name: string
  scheme: string
  amount: number
  status: ScholarRow["status"]
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): ScholarRow {
  return { id: r.id, name: r.name, scheme: r.scheme, amount: r.amount, status: r.status, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

// In-memory fallback seeded with the demo ledger so the pipeline shows content.
const store: ScholarRow[] = SCHOLARSHIP_LEDGER.map((r) => ({ ...r }))

export interface NewScholar {
  name: string
  scheme: string
  amount: number
  /** Tenant node the beneficiary is recorded at; defaults to the demo school. */
  tenantId?: string
}

export async function addBeneficiary(input: NewScholar): Promise<ScholarRow> {
  const r: ScholarRow = { id: id(), name: input.name, scheme: input.scheme, amount: input.amount, status: "eligible", tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE }
  const db = getDb()
  if (db) {
    await db.from("scholarships").insert({
      id: r.id,
      name: r.name,
      scheme: r.scheme,
      amount: r.amount,
      status: r.status,
      tenant_id: r.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(r)
  }
  await appendAudit({ actor: "welfare", action: "scholarship.add", resource: r.id, details: { scheme: r.scheme } })
  return r
}

async function load(sid: string): Promise<ScholarRow | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("scholarships").select("*").eq("id", sid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === sid)
}

export async function getBeneficiary(sid: string): Promise<ScholarRow | undefined> {
  return load(sid)
}

export async function advanceBeneficiary(sid: string): Promise<ScholarRow | undefined> {
  const r = await load(sid)
  if (!r) return undefined
  r.status = nextStatus(r.status)
  const db = getDb()
  if (db) await db.from("scholarships").update({ status: r.status }).eq("id", sid)
  await appendAudit({ actor: "welfare", action: "scholarship.advance", resource: sid, details: { status: r.status } })
  return r
}

export async function deleteBeneficiary(sid: string): Promise<boolean> {
  const existing = await load(sid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("scholarships").delete().eq("id", sid)
  } else {
    const i = store.findIndex((x) => x.id === sid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "scholarship.delete", resource: sid })
  return true
}

export async function listBeneficiaries(): Promise<ScholarRow[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("scholarships").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
