// VASA-EOS(SE) — dropout-risk register persistence (server-only).
//
// Holds the observable factors per flagged learner; the risk band + explainable triggers are
// derived on read via assessRisk (advisory, human-authority). Durable persistence is mandatory;
// missing database configuration fails closed through requireDb(). Audited. Listing returns the
// cohort ordered by risk score (highest first) so the most urgent cases lead.

import { appendAudit } from "@/lib/audit/trail"
import { requireDb } from "@/lib/db/require-db"
import { resolveSchoolScope } from "@/lib/auth/school-scope"
import type { VasaSession } from "@/lib/auth/session"
import { assessRisk, type RiskAssessment, type RiskFactors } from "./index"

/** Default UDISE code used by dashboard calls when no school is specified. */
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
    tenantId: r.tenant_id,
  }
}

function newId(): string {
  return `DR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

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

export async function recordDropoutRisk(input: NewDropout, session?: VasaSession): Promise<DropoutRecord> {
  const scope = await resolveSchoolScope(input.udiseCode, true, session)
  if (input.tenantId !== undefined && input.tenantId !== scope.tenantId) throw new Error("Tenant override is not permitted")
  const rec: DropoutRecord = {
    id: newId(),
    udiseCode: scope.udiseCode,
    name: input.name,
    cls: input.cls,
    absences: input.absences,
    attendancePct: input.attendancePct,
    recentScorePct: input.recentScorePct,
    feeDefault: input.feeDefault,
    siblingDropout: input.siblingDropout,
    tenantId: scope.tenantId,
  }
  const { error } = await requireDb().from("dropout_risk").insert({
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
  if (error) throw error
  await appendAudit({
    actor: scope.subject,
    action: "dropout.flag",
    resource: rec.id,
    details: { cls: rec.cls, band: assessRisk(rec).band },
  })
  return rec
}

/** The school's at-risk cohort with computed risk, highest score first. */
export async function listDropoutRisk(udiseCode?: string, session?: VasaSession): Promise<DropoutWithRisk[]> {
  const scope = await resolveSchoolScope(udiseCode, false, session)
  const { data, error } = await requireDb()
    .from("dropout_risk")
    .select("*")
    .eq("udise_code", scope.udiseCode)
    .eq("tenant_id", scope.tenantId)
    .order("created_at", { ascending: false })
  if (error) throw error
  const rows = ((data as Row[] | null) ?? []).map(fromRow)
  return rows
    .map((r) => ({ ...r, assessment: assessRisk(r) }))
    .sort((a, b) => b.assessment.score - a.assessment.score)
}
