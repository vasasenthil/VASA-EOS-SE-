// VASA-EOS(SE) — Student Fees persistence (server-only). Full CRUD.
// Durable in Supabase when configured (heads + receipts as JSONB); in-memory seeded fallback
// otherwise. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { FeeRecord, FeeInput, FeeHead, FeeReceipt } from "./index"

function id(): string {
  return `FEE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  student: string
  apaar_id: string
  class_level: string
  section: string
  academic_year: string
  heads: unknown
  concession_type: string
  concession_amount: number
  scholarship_scheme: string
  dbt_reference: string
  due_date: string
  receipts: unknown
  notes: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function arr<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[]
  if (typeof v === "string") {
    try { const p = JSON.parse(v); return Array.isArray(p) ? (p as T[]) : [] } catch { return [] }
  }
  return []
}

function fromRow(r: Row): FeeRecord {
  return {
    id: r.id, student: r.student, apaarId: r.apaar_id ?? "", classLevel: r.class_level, section: r.section,
    academicYear: r.academic_year, heads: arr<FeeHead>(r.heads), concessionType: r.concession_type ?? "None",
    concessionAmount: r.concession_amount ?? 0, scholarshipScheme: r.scholarship_scheme ?? "", dbtReference: r.dbt_reference ?? "",
    dueDate: r.due_date, receipts: arr<FeeReceipt>(r.receipts), notes: r.notes ?? "", createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(f: FeeRecord, tenantId: string): Record<string, unknown> {
  return {
    id: f.id, student: f.student, apaar_id: f.apaarId, class_level: f.classLevel, section: f.section,
    academic_year: f.academicYear, heads: f.heads, concession_type: f.concessionType, concession_amount: f.concessionAmount,
    scholarship_scheme: f.scholarshipScheme, dbt_reference: f.dbtReference, due_date: f.dueDate, receipts: f.receipts,
    notes: f.notes, tenant_id: tenantId, created_at: f.createdAt, updated_at: f.updatedAt,
  }
}

function standardHeads(): FeeHead[] {
  return [
    { type: "Tuition", amount: 12000 },
    { type: "Term Fee", amount: 3000 },
    { type: "Laboratory", amount: 1500 },
    { type: "Library", amount: 800 },
    { type: "Examination", amount: 1200 },
  ]
}

function seed(): FeeRecord[] {
  const now = "2026-04-01T00:00:00.000Z"
  const ay = "2026-2027"
  const mk = (
    i: number, student: string, apaar: string, cls: string, sec: string,
    concessionType: string, concessionAmount: number, scheme: string, dbt: string,
    receipts: FeeReceipt[], due = "2026-07-31",
  ): FeeRecord => ({
    id: `demo-fee-${i}`, student, apaarId: apaar, classLevel: cls, section: sec, academicYear: ay,
    heads: standardHeads(), concessionType, concessionAmount, scholarshipScheme: scheme, dbtReference: dbt,
    dueDate: due, receipts, notes: "", createdAt: now, updatedAt: now,
  })
  return [
    // fully paid
    mk(1, "Aarthi M.", "100200300401", "X", "A", "None", 0, "", "", [{ date: "2026-06-20", amount: 18500, mode: "UPI", reference: "UPI-77123" }]),
    // partial
    mk(2, "Bharath K.", "100200300402", "X", "A", "Sibling", 2000, "", "", [{ date: "2026-06-25", amount: 8000, mode: "Cash", reference: "RC-1002" }]),
    // RTE free — nothing due
    mk(3, "Chithra V.", "100200300403", "IX", "B", "RTE (Free)", 18500, "RTE 25%", "", []),
    // DBT credit toward fees
    mk(4, "Fatima B.", "100200300405", "X", "B", "DBT Credit", 5000, "Pudhumai Penn", "DBT-TN-558231", [{ date: "2026-07-01", amount: 13500, mode: "DBT Transfer", reference: "DBT-TN-558231" }]),
    // pending / defaulter (past due, nothing paid)
    mk(5, "Raju P.", "100200300406", "VIII", "A", "None", 0, "", "", [], "2026-06-15"),
    // pending (future due)
    mk(6, "Divya S.", "100200300407", "X", "A", "Merit", 1500, "Merit Scholarship", "", [], "2026-09-30"),
  ]
}

const store: FeeRecord[] = seed()

export async function listFees(): Promise<FeeRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("student_fees").select("*").order("created_at", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getFee(fid: string): Promise<FeeRecord | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("student_fees").select("*").eq("id", fid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((r) => r.id === fid)
  }
  return store.find((r) => r.id === fid)
}

export async function createFee(input: FeeInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<FeeRecord> {
  const now = new Date().toISOString()
  const r: FeeRecord = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("student_fees").insert(toRow(r, tenantId))
  else store.unshift(r)
  await appendAudit({ actor: "finance", action: "fee.create", resource: r.id, details: { student: r.student, year: r.academicYear } })
  return r
}

export async function updateFee(fid: string, input: FeeInput): Promise<FeeRecord | undefined> {
  const existing = await getFee(fid)
  if (!existing) return undefined
  const updated: FeeRecord = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("student_fees").update({
      student: updated.student, apaar_id: updated.apaarId, class_level: updated.classLevel, section: updated.section,
      academic_year: updated.academicYear, heads: updated.heads, concession_type: updated.concessionType,
      concession_amount: updated.concessionAmount, scholarship_scheme: updated.scholarshipScheme, dbt_reference: updated.dbtReference,
      due_date: updated.dueDate, receipts: updated.receipts, notes: updated.notes, updated_at: updated.updatedAt,
    }).eq("id", fid)
  } else {
    const i = store.findIndex((r) => r.id === fid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "finance", action: "fee.update", resource: fid, details: { receipts: updated.receipts.length } })
  return updated
}

export async function deleteFee(fid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("student_fees").delete().eq("id", fid)
  } else {
    const i = store.findIndex((r) => r.id === fid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "finance", action: "fee.delete", resource: fid })
  return true
}

export async function seedFees(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const r of rows) await db.from("student_fees").upsert(toRow(r, tenantId))
  } else {
    for (const r of rows) if (!store.some((s) => s.id === r.id)) store.push(r)
  }
  await appendAudit({ actor: "finance", action: "fee.seed", resource: "student_fees", details: { count: rows.length } })
  return rows.length
}
