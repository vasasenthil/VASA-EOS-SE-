// VASA-EOS(SE) — student enrolment snapshot persistence (server-only).
//
// Durable in Supabase when configured; in-memory fallback (seeded with the demo school's roll so
// the Principal dashboard always renders real, queryable data) otherwise. Every snapshot is
// audited. latestEnrolment returns the most recent snapshot per school, so saving a new roll
// supersedes the headline without losing history.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { Enrolment } from "./index"

/** The demo school's UDISE code — the in-memory seed and dashboard default. */
export const DEMO_UDISE = "33010100101"

export interface EnrolmentRecord extends Enrolment {
  id: string
  udiseCode: string
  asOf: string
  tenantId: string
}

interface Row {
  id: string
  udise_code: string
  as_of: string
  total: number
  boys: number
  girls: number
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): EnrolmentRecord {
  return { id: r.id, udiseCode: r.udise_code, asOf: r.as_of, total: r.total, boys: r.boys, girls: r.girls, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

function newId(): string {
  return `ENR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

// Seed mirrors the dashboard's historical headline of 1,248 students, split for gender parity.
const SEED: EnrolmentRecord = {
  id: newId(),
  udiseCode: DEMO_UDISE,
  asOf: "2026-04-01",
  total: 1248,
  boys: 636,
  girls: 612,
  tenantId: DEFAULT_SCHOOL_NODE,
}

const store: EnrolmentRecord[] = [SEED]

export interface NewEnrolment {
  udiseCode?: string
  asOf: string
  total: number
  boys: number
  girls: number
  tenantId?: string
}

export async function saveEnrolment(input: NewEnrolment): Promise<EnrolmentRecord> {
  const rec: EnrolmentRecord = {
    id: newId(),
    udiseCode: input.udiseCode ?? DEMO_UDISE,
    asOf: input.asOf,
    total: input.total,
    boys: input.boys,
    girls: input.girls,
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("enrolment_snapshots").insert({
      id: rec.id,
      udise_code: rec.udiseCode,
      as_of: rec.asOf,
      total: rec.total,
      boys: rec.boys,
      girls: rec.girls,
      tenant_id: rec.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({
    actor: "office",
    action: "enrolment.snapshot",
    resource: `${rec.udiseCode}/${rec.asOf}`,
    details: { total: rec.total, boys: rec.boys, girls: rec.girls },
  })
  return rec
}

async function listEnrolment(udiseCode: string): Promise<EnrolmentRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db
        .from("enrolment_snapshots")
        .select("*")
        .eq("udise_code", udiseCode)
        .order("as_of", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return store.filter((r) => r.udiseCode === udiseCode).sort((a, b) => (a.asOf < b.asOf ? 1 : -1))
}

/** The most recent enrolment snapshot for a school, or undefined if none. */
export async function latestEnrolment(udiseCode: string = DEMO_UDISE): Promise<EnrolmentRecord | undefined> {
  const rows = await listEnrolment(udiseCode)
  return rows[0]
}
