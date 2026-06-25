// VASA-EOS(SE) — dropout-risk register persistence (server-only).
//
// Holds the observable factors per flagged learner; the risk band + explainable triggers are
// derived on read via assessRisk (advisory, human-authority). Durable in Supabase when configured;
// in-memory fallback (seeded with the demo school's at-risk cohort) otherwise. Audited. Listing
// returns the cohort ordered by risk score (highest first) so the most urgent cases lead.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { assessRisk, type RiskAssessment, type RiskFactors } from "./index"

/** The demo school's UDISE code — the in-memory seed and dashboard default. */
export const DEMO_UDISE = "33010100101"

export interface DropoutRecord extends RiskFactors {
  id: string
  udiseCode: string
  name: string
  cls: string
  absences: number
  tenantId: string
}

export interface DropoutWithRisk extends DropoutRecord {
  assessment: RiskAssessment
}

interface Row {
  id: string
  udise_code: string
  name: string
  cls: string
  absences: number
  attendance_pct: number
  recent_score_pct: number
  fee_default: boolean
  sibling_dropout: boolean
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): DropoutRecord {
  return {
    id: r.id,
    udiseCode: r.udise_code,
    name: r.name,
    cls: r.cls,
    absences: r.absences,
    attendancePct: r.attendance_pct,
    recentScorePct: r.recent_score_pct,
    feeDefault: r.fee_default,
    siblingDropout: r.sibling_dropout,
    tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE,
  }
}

function newId(): string {
  return `DR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

// Seed mirrors the demo cohort the dashboard historically hardcoded, now factor-driven so the
// risk band and triggers are computed (explainable) rather than asserted.
const SEED_FACTORS: Array<Omit<DropoutRecord, "id" | "udiseCode" | "tenantId">> = [
  { name: "Meena Kumari", cls: "IX-B", absences: 14, attendancePct: 60, recentScorePct: 45, feeDefault: true, siblingDropout: false },
  { name: "Raju Prasad", cls: "VIII-A", absences: 11, attendancePct: 68, recentScorePct: 38, feeDefault: false, siblingDropout: false },
  { name: "Fatima Begum", cls: "X-C", absences: 8, attendancePct: 82, recentScorePct: 48, feeDefault: false, siblingDropout: false },
  { name: "Arjun Singh", cls: "VII-B", absences: 7, attendancePct: 84, recentScorePct: 60, feeDefault: false, siblingDropout: true },
]

const store: DropoutRecord[] = SEED_FACTORS.map((f) => ({
  id: newId(),
  udiseCode: DEMO_UDISE,
  tenantId: DEFAULT_SCHOOL_NODE,
  ...f,
}))

export interface NewDropout {
  udiseCode?: string
  name: string
  cls: string
  absences: number
  attendancePct: number
  recentScorePct: number
  feeDefault: boolean
  siblingDropout: boolean
  tenantId?: string
}

export async function recordDropoutRisk(input: NewDropout): Promise<DropoutRecord> {
  const rec: DropoutRecord = {
    id: newId(),
    udiseCode: input.udiseCode ?? DEMO_UDISE,
    name: input.name,
    cls: input.cls,
    absences: input.absences,
    attendancePct: input.attendancePct,
    recentScorePct: input.recentScorePct,
    feeDefault: input.feeDefault,
    siblingDropout: input.siblingDropout,
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("dropout_risk").insert({
      id: rec.id,
      udise_code: rec.udiseCode,
      name: rec.name,
      cls: rec.cls,
      absences: rec.absences,
      attendance_pct: rec.attendancePct,
      recent_score_pct: rec.recentScorePct,
      fee_default: rec.feeDefault,
      sibling_dropout: rec.siblingDropout,
      tenant_id: rec.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({
    actor: "school",
    action: "dropout.flag",
    resource: rec.id,
    details: { cls: rec.cls, band: assessRisk(rec).band },
  })
  return rec
}

/** The school's at-risk cohort with computed risk, highest score first. */
export async function listDropoutRisk(udiseCode: string = DEMO_UDISE): Promise<DropoutWithRisk[]> {
  const db = getDb()
  let rows: DropoutRecord[]
  if (db) {
    try {
      const { data } = await db.from("dropout_risk").select("*").eq("udise_code", udiseCode).order("created_at", { ascending: false })
      rows = ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      rows = []
    }
  } else {
    rows = store.filter((r) => r.udiseCode === udiseCode)
  }
  return rows
    .map((r) => ({ ...r, assessment: assessRisk(r) }))
    .sort((a, b) => b.assessment.score - a.assessment.score)
}
