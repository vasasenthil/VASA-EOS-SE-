// VASA-EOS(SE) — monthly fee-collection snapshot persistence (server-only).
//
// Durable in Supabase when configured; in-memory fallback (seeded with the demo school's latest
// month so the Principal dashboard always renders real, queryable data) otherwise. Every saved
// snapshot is audited. latestCollection returns the most recent month for a school, so saving a
// new month supersedes the card figure without losing history.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { FeeCollection } from "./collection"

/** The demo school's UDISE code — the in-memory seed and dashboard default. */
export const DEMO_UDISE = "33010100101"

export interface FeeCollectionRecord extends FeeCollection {
  id: string
  udiseCode: string
  period: string
  tenantId: string
}

interface Row {
  id: string
  udise_code: string
  month: string
  period: string
  billed: number
  collected: number
  defaulters: number
  rte_students: number
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): FeeCollectionRecord {
  return {
    id: r.id,
    udiseCode: r.udise_code,
    month: r.month,
    period: r.period,
    billed: r.billed,
    collected: r.collected,
    defaulters: r.defaulters,
    rteStudents: r.rte_students,
    tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE,
  }
}

function newId(): string {
  return `FEE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

// Seed mirrors the figures the dashboard historically hardcoded, now queryable: ₹12.4L billed,
// ₹8.4L collected (67.7%), 87 defaulters, 213 RTE free-seat students for April 2025.
const SEED: FeeCollectionRecord = {
  id: newId(),
  udiseCode: DEMO_UDISE,
  month: "April 2025",
  period: "2025-04",
  billed: 1240000,
  collected: 840000,
  defaulters: 87,
  rteStudents: 213,
  tenantId: DEFAULT_SCHOOL_NODE,
}

const store: FeeCollectionRecord[] = [SEED]

export interface NewFeeCollection {
  udiseCode?: string
  month: string
  period: string
  billed: number
  collected: number
  defaulters: number
  rteStudents: number
  tenantId?: string
}

export async function saveCollection(input: NewFeeCollection): Promise<FeeCollectionRecord> {
  const rec: FeeCollectionRecord = {
    id: newId(),
    udiseCode: input.udiseCode ?? DEMO_UDISE,
    month: input.month,
    period: input.period,
    billed: input.billed,
    collected: input.collected,
    defaulters: input.defaulters,
    rteStudents: input.rteStudents,
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("fee_collection").insert({
      id: rec.id,
      udise_code: rec.udiseCode,
      month: rec.month,
      period: rec.period,
      billed: rec.billed,
      collected: rec.collected,
      defaulters: rec.defaulters,
      rte_students: rec.rteStudents,
      tenant_id: rec.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({
    actor: "school",
    action: "fees.snapshot",
    resource: `${rec.udiseCode}/${rec.period}`,
    details: { billed: rec.billed, collected: rec.collected },
  })
  return rec
}

async function listCollections(udiseCode: string): Promise<FeeCollectionRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db
        .from("fee_collection")
        .select("*")
        .eq("udise_code", udiseCode)
        .order("period", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return store.filter((r) => r.udiseCode === udiseCode).sort((a, b) => (a.period < b.period ? 1 : -1))
}

/** The most recent fee-collection snapshot for a school, or undefined if none. */
export async function latestCollection(udiseCode: string = DEMO_UDISE): Promise<FeeCollectionRecord | undefined> {
  const rows = await listCollections(udiseCode)
  return rows[0]
}
