"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { assessRisk, cohortInsight, riskSummary, filterAssessments, type StudentSignals, type RiskAssessment, type CohortInsight, type RiskSummary, type AssessmentFilters } from "@/lib/earlywarning"
import { listCases, getCase, createCase, updateCase, deleteCase } from "@/lib/earlywarning/store"
import { validateCase, caseSummary, queryCases, type EwsCase, type CaseInput, type CaseSummary } from "@/lib/earlywarning/case"
import { listAttendance } from "@/lib/attendance-register/store"
import { attendanceRate } from "@/lib/attendance-register"
import { listFees } from "@/lib/studentfees/store"
import { balance as feeBalance, isDefaulter } from "@/lib/studentfees"
import { listReportCards } from "@/lib/reportcards/store"
import { reportTotals, PASS_MARK_PCT } from "@/lib/reportcards"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

/** Join Attendance + Fees + Report Cards by student into per-student signals (pure-ish helper). */
async function buildSignals(): Promise<StudentSignals[]> {
  const [attendance, fees, cards] = await Promise.all([listAttendance(), listFees(), listReportCards()])
  const names = new Set<string>()
  attendance.forEach((a) => names.add(a.student))
  fees.forEach((f) => names.add(f.student))
  cards.forEach((c) => names.add(c.student))

  const signals: StudentSignals[] = []
  for (const name of names) {
    const att = attendance.filter((a) => a.student === name)
    const fee = fees.find((f) => f.student === name)
    const card = [...cards].filter((c) => c.student === name).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0]
    const meta = card ?? fee ?? att[0]
    const academicPct = card ? reportTotals(card.subjects).pct : null
    const failedSubjects = card ? card.subjects.filter((s) => (s.maxMarks > 0 ? (s.marks / s.maxMarks) * 100 : 0) < PASS_MARK_PCT).length : 0
    signals.push({
      student: name,
      apaarId: (card?.apaarId || fee?.apaarId || att[0]?.apaarId) ?? "",
      classLevel: (meta as { classLevel?: string })?.classLevel ?? "",
      section: (meta as { section?: string })?.section ?? "",
      attendancePct: att.length > 0 ? attendanceRate(att).pct : 100,
      attendanceCount: att.length,
      feeBalance: fee ? Math.max(0, feeBalance(fee)) : 0,
      feeDefaulter: fee ? isDefaulter(fee) : false,
      academicPct,
      failedSubjects,
    })
  }
  return signals
}

export interface EwsDashboard {
  assessments: RiskAssessment[]
  summary: RiskSummary
  cohort: CohortInsight
}

export async function earlyWarningDashboardAction(filters: AssessmentFilters = {}): Promise<EwsDashboard> {
  noStore()
  try {
    const signals = await buildSignals()
    const all = signals.map(assessRisk)
    const cohort = cohortInsight(all, signals.map((s) => s.attendancePct))
    return { assessments: filterAssessments(all, filters), summary: riskSummary(all), cohort }
  } catch (e) {
    logger.error("ews.dashboard failed", { error: String(e) })
    return { assessments: [], summary: { total: 0, high: 0, medium: 0, low: 0 }, cohort: { analytics: { n: 0, mean: 0, median: 0, min: 0, max: 0, stdev: 0, trend: "flat", anomalies: [], confidence: 0, explanation: "Unavailable.", humanAuthority: true }, outlierStudents: [] } }
  }
}

// ── HITL case management ──────────────────────────────────────────────────────
export async function listCasesAction(status?: string): Promise<{ cases: EwsCase[]; summary: CaseSummary }> {
  noStore()
  try {
    const all = await listCases()
    return { cases: queryCases(all, status), summary: caseSummary(all) }
  } catch (e) {
    logger.error("ews.cases failed", { error: String(e) })
    return { cases: [], summary: { total: 0, open: 0, acknowledged: 0, resolved: 0 } }
  }
}

export async function getCaseAction(id: string): Promise<EwsCase | null> {
  noStore()
  try {
    return (await getCase(id)) ?? null
  } catch (e) {
    logger.error("ews.getCase failed", { error: String(e) })
    return null
  }
}

export async function openCaseAction(input: CaseInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage early-warning cases." }
  const v = validateCase(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const c = await createCase(input)
    revalidatePath("/early-warning")
    return { ok: true, id: c.id }
  } catch (e) {
    logger.error("ews.open failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateCaseAction(id: string, input: CaseInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage early-warning cases." }
  const v = validateCase(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateCase(id, input)
    if (!updated) return { ok: false, reason: "Case not found." }
    revalidatePath("/early-warning")
    return { ok: true }
  } catch (e) {
    logger.error("ews.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteCaseAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage early-warning cases." }
  try {
    const ok = await deleteCase(id)
    revalidatePath("/early-warning")
    return { ok }
  } catch (e) {
    logger.error("ews.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
