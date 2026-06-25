import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { assessRisk, cohortInsight, riskSummary, filterAssessments, type StudentSignals } from "@/lib/earlywarning"
import { validateCase, caseSummary, queryCases, type EwsCase, type CaseInput } from "@/lib/earlywarning/case"
import { listCases, getCase, createCase, updateCase, deleteCase } from "@/lib/earlywarning/store"

function signals(over: Partial<StudentSignals> = {}): StudentSignals {
  return { student: "X", apaarId: "", classLevel: "X", section: "A", attendancePct: 95, attendanceCount: 20, feeBalance: 0, feeDefaulter: false, academicPct: 80, failedSubjects: 0, ...over }
}

test("assessRisk: chronic absence + fail + defaulter → High, explainable factors, humanAuthority", () => {
  const r = assessRisk(signals({ attendancePct: 55, academicPct: 30, failedSubjects: 2, feeDefaulter: true, feeBalance: 3000 }))
  assert.equal(r.level, "High")
  assert.ok(r.score >= 60)
  assert.equal(r.humanAuthority, true)
  assert.ok(r.factors.some((f) => f.domain === "Attendance"))
  assert.ok(r.factors.some((f) => f.domain === "Academic"))
  assert.ok(r.factors.some((f) => f.domain === "Financial"))
  assert.match(r.recommendation, /\w+/)
})

test("assessRisk: clean student → Low with no factors", () => {
  const r = assessRisk(signals())
  assert.equal(r.level, "Low")
  assert.equal(r.factors.length, 0)
  assert.equal(r.score, 0)
})

test("assessRisk: single low-attendance factor scores 20 → still Low (Medium starts at 30)", () => {
  const r = assessRisk(signals({ attendancePct: 70, attendanceCount: 20 })) // low attendance +20
  assert.equal(r.score, 20)
  assert.equal(r.level, "Low")
})

test("assessRisk: thresholds (30 Medium, 60 High)", () => {
  assert.equal(assessRisk(signals({ attendancePct: 70, attendanceCount: 5, academicPct: 45 })).level, "Medium") // 20 + 15 = 35
  assert.equal(assessRisk(signals({ attendancePct: 55, attendanceCount: 5, academicPct: 45 })).level, "Medium") // 40 + 15 = 55
  assert.equal(assessRisk(signals({ attendancePct: 55, attendanceCount: 5, academicPct: 30, failedSubjects: 1 })).level, "High") // 40 + 25 = 65
})

test("cohortInsight genuinely runs the Analytics Engine and maps outliers to students", () => {
  const students = [{ student: "A" }, { student: "B" }, { student: "C" }, { student: "D" }, { student: "E" }]
  const pcts = [95, 96, 94, 30, 95] // D is the outlier
  const ci = cohortInsight(students, pcts)
  assert.equal(ci.analytics.humanAuthority, true)
  assert.equal(ci.analytics.n, 5)
  assert.ok(ci.outlierStudents.includes("D"))
})

test("riskSummary + filterAssessments (level/search, sorted by score)", () => {
  const all = [
    assessRisk(signals({ student: "High1", attendancePct: 50, attendanceCount: 5, academicPct: 30, failedSubjects: 2 })),
    assessRisk(signals({ student: "Med1", attendancePct: 70, attendanceCount: 5, academicPct: 45 })),
    assessRisk(signals({ student: "Low1" })),
  ]
  const s = riskSummary(all)
  assert.equal(s.total, 3)
  assert.equal(s.high, 1)
  assert.ok(filterAssessments(all, { level: "High" }).every((a) => a.level === "High"))
  assert.equal(filterAssessments(all, { query: "med" })[0].student, "Med1")
  const sorted = filterAssessments(all)
  assert.ok(sorted[0].score >= sorted[sorted.length - 1].score)
})

// ── HITL case model + store ───────────────────────────────────────────────────
function validCase(over: Partial<CaseInput> = {}): CaseInput {
  return { student: "Bharath K.", apaarId: "100200300402", classLevel: "X", section: "A", riskLevel: "High", score: 60, factors: "Low attendance", status: "Open", assignee: "", intervention: "", openedBy: "Principal", ...over }
}

test("validateCase enforces the HITL workflow (assignee to acknowledge, intervention to resolve)", () => {
  assert.equal(validateCase(validCase()).ok, true)
  assert.ok(validateCase(validCase({ status: "Acknowledged", assignee: "" })).errors.assignee)
  assert.equal(validateCase(validCase({ status: "Acknowledged", assignee: "Counsellor" })).ok, true)
  assert.ok(validateCase(validCase({ status: "Resolved", assignee: "C", intervention: "" })).errors.intervention)
})

test("caseSummary + queryCases (status filter, Open first)", () => {
  const cases: EwsCase[] = [
    { ...validCase({ status: "Resolved" }), id: "a", createdAt: "", updatedAt: "" },
    { ...validCase({ status: "Open" }), id: "b", createdAt: "", updatedAt: "" },
  ] as EwsCase[]
  const s = caseSummary(cases)
  assert.equal(s.open, 1)
  assert.equal(s.resolved, 1)
  assert.equal(queryCases(cases)[0].status, "Open") // open sorted first
  assert.ok(queryCases(cases, "Resolved").every((c) => c.status === "Resolved"))
})

test("case store CRUD: open → acknowledge → resolve → delete (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createCase(validCase())
  assert.match(created.id, /^EWS-/)
  assert.equal((await getCase(created.id))?.status, "Open")
  const ack = await updateCase(created.id, validCase({ status: "Acknowledged", assignee: "Counsellor" }))
  assert.equal(ack?.status, "Acknowledged")
  assert.equal(await deleteCase(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback is seeded with demo cases", async () => {
  __setTestDb(null)
  const all = await listCases()
  assert.ok(all.length >= 2)
})
