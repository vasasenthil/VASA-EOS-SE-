// VASA-EOS(SE) — Drinking-water quality test log persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.
// Tests are immutable records — create, list and (corrective) delete only.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { isPhSafe, type WaterTest } from "./index"

function id(): string {
  return `WT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  source: string
  date: string
  ph: number
  result: WaterTest["result"]
  remarks: string
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): WaterTest {
  return { id: r.id, source: r.source, date: r.date, ph: r.ph, result: r.result, remarks: r.remarks, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

// Seeded across tenant nodes so WASH results roll up by jurisdiction.
const store: WaterTest[] = [
  { id: "WT-SEED1", source: "RO / purifier unit", date: "2026-06-01", ph: 7.2, result: "safe", remarks: "Within range", tenantId: "TN-CHN-B1-S1" },
  { id: "WT-SEED2", source: "Overhead tank", date: "2026-05-28", ph: 6.1, result: "unsafe", remarks: "Acidic — chlorinate", tenantId: "TN-CHN-B2-S1" },
  { id: "WT-SEED3", source: "Borewell", date: "2026-05-30", ph: 7.8, result: "safe", remarks: "OK", tenantId: "TN-CBE-B1-S1" },
]

export interface NewTest {
  source: string
  date: string
  ph: number
  remarks: string
  /** Tenant node the test is logged at; defaults to the demo school. */
  tenantId?: string
}

export async function createTest(input: NewTest): Promise<WaterTest> {
  // The result is derived server-side from the pH so it can't be falsified client-side.
  const t: WaterTest = {
    id: id(),
    source: input.source,
    date: input.date,
    ph: input.ph,
    result: isPhSafe(input.ph) ? "safe" : "unsafe",
    remarks: input.remarks,
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("water_tests").insert({
      id: t.id,
      source: t.source,
      date: t.date,
      ph: t.ph,
      result: t.result,
      remarks: t.remarks,
      tenant_id: t.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(t)
  }
  await appendAudit({ actor: "wash", action: "water.test", resource: t.id, details: { result: t.result } })
  return t
}

async function load(tid: string): Promise<WaterTest | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("water_tests").select("*").eq("id", tid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === tid)
}

export async function getTest(tid: string): Promise<WaterTest | undefined> {
  return load(tid)
}

export async function deleteTest(tid: string): Promise<boolean> {
  const existing = await load(tid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("water_tests").delete().eq("id", tid)
  } else {
    const i = store.findIndex((x) => x.id === tid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "water.delete", resource: tid })
  return true
}

export async function listTests(): Promise<WaterTest[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("water_tests").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
