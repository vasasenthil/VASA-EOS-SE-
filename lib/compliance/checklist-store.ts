// VASA-EOS(SE) — school statutory-compliance checklist persistence (server-only).
//
// Durable in Supabase when configured; in-memory fallback (seeded with the demo school's statutory
// items) otherwise. Adding an item and changing a status are both audited. Listing returns the
// school's items in a stable order (overdue/pending lead so attention items surface first).

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { ComplianceItem, ComplianceStatus } from "./checklist"

/** The demo school's UDISE code — the in-memory seed and dashboard default. */
export const DEMO_UDISE = "33010100101"

export interface ComplianceRecord extends ComplianceItem {
  id: string
  udiseCode: string
  tenantId: string
}

interface Row {
  id: string
  udise_code: string
  item: string
  status: ComplianceStatus
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): ComplianceRecord {
  return { id: r.id, udiseCode: r.udise_code, item: r.item, status: r.status, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

function newId(): string {
  return `CMP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

// Attention-first ordering so overdue/pending statutory items lead the checklist.
const STATUS_RANK: Record<ComplianceStatus, number> = { Overdue: 0, Pending: 1, "In Progress": 2, Done: 3 }

// Seed mirrors the statutory items the dashboard historically hardcoded, now durable.
const SEED: Array<Omit<ComplianceRecord, "id">> = [
  { udiseCode: DEMO_UDISE, item: "SMC Meeting (March)", status: "Done", tenantId: DEFAULT_SCHOOL_NODE },
  { udiseCode: DEMO_UDISE, item: "UDISE+ Data Submission", status: "Done", tenantId: DEFAULT_SCHOOL_NODE },
  { udiseCode: DEMO_UDISE, item: "Mid-Day Meal Register (today)", status: "Done", tenantId: DEFAULT_SCHOOL_NODE },
  { udiseCode: DEMO_UDISE, item: "Fire Safety Drill (Q1)", status: "Overdue", tenantId: DEFAULT_SCHOOL_NODE },
  { udiseCode: DEMO_UDISE, item: "Annual Health Screening", status: "Pending", tenantId: DEFAULT_SCHOOL_NODE },
  { udiseCode: DEMO_UDISE, item: "Teacher CPD Hours (Q1)", status: "In Progress", tenantId: DEFAULT_SCHOOL_NODE },
]

const store: ComplianceRecord[] = SEED.map((s) => ({ id: newId(), ...s }))

export interface NewComplianceItem {
  udiseCode?: string
  item: string
  status: ComplianceStatus
  tenantId?: string
}

export async function addComplianceItem(input: NewComplianceItem): Promise<ComplianceRecord> {
  const rec: ComplianceRecord = {
    id: newId(),
    udiseCode: input.udiseCode ?? DEMO_UDISE,
    item: input.item,
    status: input.status,
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("school_compliance").insert({
      id: rec.id,
      udise_code: rec.udiseCode,
      item: rec.item,
      status: rec.status,
      tenant_id: rec.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.push(rec)
  }
  await appendAudit({ actor: "school", action: "compliance.add", resource: rec.id, details: { item: rec.item, status: rec.status } })
  return rec
}

export async function setComplianceStatus(id: string, status: ComplianceStatus): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("school_compliance").update({ status }).eq("id", id)
  } else {
    const rec = store.find((r) => r.id === id)
    if (!rec) return false
    rec.status = status
  }
  await appendAudit({ actor: "school", action: "compliance.status", resource: id, details: { status } })
  return true
}

export async function listCompliance(udiseCode: string = DEMO_UDISE): Promise<ComplianceRecord[]> {
  const db = getDb()
  let rows: ComplianceRecord[]
  if (db) {
    try {
      const { data } = await db.from("school_compliance").select("*").eq("udise_code", udiseCode).order("created_at", { ascending: true })
      rows = ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      rows = []
    }
  } else {
    rows = store.filter((r) => r.udiseCode === udiseCode)
  }
  return [...rows].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status])
}
