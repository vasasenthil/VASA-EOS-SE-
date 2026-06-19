// VASA-EOS(SE) — outcome instrumentation persistence (server-only). Ingest + query.
// Durable in Supabase when configured; in-memory seeded fallback otherwise. Every ingest audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { OutcomeRecord, OutcomeInput, SchoolCategory, Area, Gender, SocialCategory } from "./index"

function id(): string {
  return `OUT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  term: string
  district: string
  school_category: string
  area: string
  gender: string
  social_category: string
  pwd: boolean
  fln_pct: number
  attendance_pct: number
  transition_pct: number
  pass_pct: number
  cohort_size: number
  tenant_id: string
}

function fromRow(r: Row): OutcomeRecord {
  return {
    id: r.id, term: r.term, district: r.district, schoolCategory: r.school_category as SchoolCategory, area: r.area as Area,
    gender: r.gender as Gender, socialCategory: r.social_category as SocialCategory, pwd: r.pwd,
    flnPct: Number(r.fln_pct), attendancePct: Number(r.attendance_pct), transitionPct: Number(r.transition_pct),
    passPct: Number(r.pass_pct), cohortSize: Number(r.cohort_size),
  }
}

function toRow(r: OutcomeRecord, tenantId: string): Row {
  return {
    id: r.id, term: r.term, district: r.district, school_category: r.schoolCategory, area: r.area, gender: r.gender,
    social_category: r.socialCategory, pwd: r.pwd, fln_pct: r.flnPct, attendance_pct: r.attendancePct,
    transition_pct: r.transitionPct, pass_pct: r.passPct, cohort_size: r.cohortSize, tenant_id: tenantId,
  }
}

// Demo cohort outcomes. Deliberately surface real, shrinkable gaps: rural < urban, government < private,
// SC/ST < General, PwD < Non-PwD — so the opportunity-gap index has something to show and shrink.
function seed(): OutcomeRecord[] {
  type S = [string, SchoolCategory, Area, Gender, SocialCategory, boolean, number, number, number, number, number]
  const rows: S[] = [
    // district, category, area, gender, social, pwd, fln, attend, transition, pass, cohort
    ["Chennai", "Government", "Urban", "Female", "General", false, 82, 94, 97, 91, 4200],
    ["Chennai", "Government", "Urban", "Male", "OBC", false, 78, 91, 95, 88, 4400],
    ["Chennai", "Private", "Urban", "Female", "General", false, 88, 96, 98, 94, 2600],
    ["Chennai", "Matriculation", "Urban", "Male", "MBC", false, 85, 95, 97, 92, 2200],
    ["Coimbatore", "Government", "Rural", "Female", "SC", false, 64, 86, 90, 79, 3100],
    ["Coimbatore", "Government", "Rural", "Male", "SC", false, 61, 84, 88, 76, 3300],
    ["Coimbatore", "Aided", "Rural", "Female", "OBC", false, 70, 88, 92, 83, 1900],
    ["Coimbatore", "Private", "Urban", "Male", "General", false, 86, 95, 97, 93, 1700],
    ["Nilgiris", "Government", "Rural", "Female", "ST", false, 56, 81, 85, 72, 1500],
    ["Nilgiris", "Government", "Rural", "Male", "ST", false, 53, 79, 83, 69, 1600],
    ["Nilgiris", "Government", "Rural", "Female", "ST", true, 47, 74, 78, 63, 320], // PwD cohort
    ["Madurai", "Government", "Urban", "Female", "MBC", false, 76, 90, 94, 86, 3800],
    ["Madurai", "Government", "Rural", "Male", "OBC", false, 68, 87, 91, 81, 3600],
    ["Madurai", "Matriculation", "Urban", "Female", "General", false, 84, 94, 96, 91, 2100],
    ["Madurai", "Government", "Urban", "Transgender", "General", false, 70, 85, 90, 80, 90],
    ["Chennai", "Government", "Urban", "Male", "General", true, 64, 82, 86, 74, 410], // PwD cohort
  ]
  return rows.map((r, i) => ({
    id: `demo-out-${i + 1}`, term: "2025-26 T2", district: r[0], schoolCategory: r[1], area: r[2], gender: r[3],
    socialCategory: r[4], pwd: r[5], flnPct: r[6], attendancePct: r[7], transitionPct: r[8], passPct: r[9], cohortSize: r[10],
  }))
}

const store: OutcomeRecord[] = seed()

export async function listOutcomes(): Promise<OutcomeRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("outcome_records").select("*").order("district", { ascending: true })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function createOutcome(input: OutcomeInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<OutcomeRecord> {
  const r: OutcomeRecord = { id: id(), ...input }
  const db = getDb()
  if (db) await db.from("outcome_records").insert(toRow(r, tenantId))
  else store.unshift(r)
  await appendAudit({ actor: "analytics", action: "outcome.ingest", resource: r.id, details: { district: r.district, cohort: r.cohortSize } })
  return r
}

export async function deleteOutcome(rid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("outcome_records").delete().eq("id", rid)
  } else {
    const i = store.findIndex((r) => r.id === rid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "analytics", action: "outcome.delete", resource: rid })
  return true
}

export async function seedOutcomes(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const r of rows) await db.from("outcome_records").upsert(toRow(r, tenantId))
  } else {
    for (const r of rows) if (!store.some((s) => s.id === r.id)) store.push(r)
  }
  await appendAudit({ actor: "analytics", action: "outcome.seed", resource: "outcome_records", details: { count: rows.length } })
  return rows.length
}
