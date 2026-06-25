// VASA-EOS(SE) — School KPI snapshot persistence (server-only). Full CRUD.
// Durable in Supabase when configured; in-memory seeded fallback otherwise. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { SchoolKpi, KpiInput } from "./index"

function id(): string {
  return `KPI-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  school_name: string
  udise: string
  district: string
  block: string
  enrolment: number
  attendance_pct: number
  pass_pct: number
  fee_collection_pct: number
  at_risk_count: number
  compliance_gaps: number
  academic_year: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function fromRow(r: Row): SchoolKpi {
  return {
    id: r.id, schoolName: r.school_name, udise: r.udise, district: r.district, block: r.block, enrolment: r.enrolment,
    attendancePct: r.attendance_pct, passPct: r.pass_pct, feeCollectionPct: r.fee_collection_pct, atRiskCount: r.at_risk_count,
    complianceGaps: r.compliance_gaps, academicYear: r.academic_year, createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(k: SchoolKpi, tenantId: string): Row {
  return {
    id: k.id, school_name: k.schoolName, udise: k.udise, district: k.district, block: k.block, enrolment: k.enrolment,
    attendance_pct: k.attendancePct, pass_pct: k.passPct, fee_collection_pct: k.feeCollectionPct, at_risk_count: k.atRiskCount,
    compliance_gaps: k.complianceGaps, academic_year: k.academicYear, tenant_id: tenantId, created_at: k.createdAt, updated_at: k.updatedAt,
  }
}

function seed(): SchoolKpi[] {
  const now = "2026-04-01T00:00:00.000Z"
  const ay = "2026-2027"
  const mk = (i: number, name: string, udise: string, district: string, block: string, enrol: number, att: number, pass: number, fee: number, risk: number, gaps: number): SchoolKpi => ({
    id: `demo-kpi-${i}`, schoolName: name, udise, district, block, enrolment: enrol, attendancePct: att, passPct: pass, feeCollectionPct: fee, atRiskCount: risk, complianceGaps: gaps, academicYear: ay, createdAt: now, updatedAt: now,
  })
  return [
    mk(1, "GHSS Egmore", "33010100101", "Chennai", "Egmore", 1240, 88, 82, 91, 9, 1),
    mk(2, "GGHSS Egmore", "33010100102", "Chennai", "Egmore", 980, 72, 64, 78, 22, 2),
    mk(3, "GHS Triplicane", "33010100201", "Chennai", "Triplicane", 760, 91, 88, 95, 4, 0),
    mk(4, "GHSS Velachery", "33010100301", "Chennai", "Velachery", 1420, 84, 76, 88, 14, 1),
    mk(5, "GHSS Coimbatore North", "33020100101", "Coimbatore", "CBE North", 1610, 90, 85, 93, 7, 0),
    mk(6, "GGHS Coimbatore", "33020100201", "Coimbatore", "CBE South", 880, 69, 58, 64, 31, 3),
    mk(7, "GHS Pollachi", "33020100301", "Coimbatore", "Pollachi", 540, 86, 80, 82, 6, 1),
    mk(8, "GHSS Madurai East", "33030100101", "Madurai", "Madurai East", 1330, 81, 73, 85, 18, 2),
  ]
}

const store: SchoolKpi[] = seed()

export async function listKpis(): Promise<SchoolKpi[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("school_kpis").select("*").order("district", { ascending: true })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getKpi(kid: string): Promise<SchoolKpi | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("school_kpis").select("*").eq("id", kid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((k) => k.id === kid)
  }
  return store.find((k) => k.id === kid)
}

export async function createKpi(input: KpiInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<SchoolKpi> {
  const now = new Date().toISOString()
  const k: SchoolKpi = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("school_kpis").insert(toRow(k, tenantId))
  else store.unshift(k)
  await appendAudit({ actor: "governance", action: "kpi.create", resource: k.id, details: { school: k.schoolName, district: k.district } })
  return k
}

export async function updateKpi(kid: string, input: KpiInput): Promise<SchoolKpi | undefined> {
  const existing = await getKpi(kid)
  if (!existing) return undefined
  const updated: SchoolKpi = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("school_kpis").update({
      school_name: updated.schoolName, udise: updated.udise, district: updated.district, block: updated.block, enrolment: updated.enrolment,
      attendance_pct: updated.attendancePct, pass_pct: updated.passPct, fee_collection_pct: updated.feeCollectionPct,
      at_risk_count: updated.atRiskCount, compliance_gaps: updated.complianceGaps, academic_year: updated.academicYear, updated_at: updated.updatedAt,
    }).eq("id", kid)
  } else {
    const i = store.findIndex((k) => k.id === kid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "governance", action: "kpi.update", resource: kid, details: { school: updated.schoolName } })
  return updated
}

export async function deleteKpi(kid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("school_kpis").delete().eq("id", kid)
  } else {
    const i = store.findIndex((k) => k.id === kid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "governance", action: "kpi.delete", resource: kid })
  return true
}

export async function seedKpis(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const k of rows) await db.from("school_kpis").upsert(toRow(k, tenantId))
  } else {
    for (const k of rows) if (!store.some((s) => s.id === k.id)) store.push(k)
  }
  await appendAudit({ actor: "governance", action: "kpi.seed", resource: "school_kpis", details: { count: rows.length } })
  return rows.length
}
