import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { emptyReportCard, validateReportCard, reportTotals, queryReportCards, type ReportCard, type ReportCardInput, type SubjectResult } from "@/lib/reportcards"
import { listReportCards, getReportCard, createReportCard, updateReportCard, deleteReportCard, seedReportCards } from "@/lib/reportcards/store"

function subjects(marks: number[]): SubjectResult[] {
  const names = ["Tamil", "English", "Mathematics", "Science", "Social Science"]
  return marks.map((m, i) => ({ subject: names[i], marks: m, maxMarks: 100 }))
}
function valid(): ReportCardInput {
  return { student: "Kavya R.", apaarId: "100200300420", classLevel: "X", term: "Annual", subjects: subjects([92, 88, 95, 90, 89]), attendancePct: 96, remarks: "Excellent.", status: "Published" }
}

test("reportTotals rolls up marks, grade and Pass/Fail (fail if any subject < 33%)", () => {
  const pass = reportTotals(subjects([92, 88, 95, 90, 89]))
  assert.equal(pass.obtained, 454)
  assert.equal(pass.max, 500)
  assert.equal(pass.pct, 90.8)
  assert.equal(pass.grade, "A2")
  assert.equal(pass.outcome, "Pass")
  const fail = reportTotals(subjects([90, 30, 90, 90, 90])) // English 30% < 33 → Fail despite high overall
  assert.equal(fail.outcome, "Fail")
  assert.equal(reportTotals([]).outcome, "Fail")
})

test("validation: subjects required, unique, marks within max, APAAR optional", () => {
  assert.equal(validateReportCard(valid()).ok, true)
  assert.ok(validateReportCard({ ...valid(), subjects: [] }).errors.subjects)
  assert.ok(validateReportCard({ ...valid(), subjects: [{ subject: "Tamil", marks: 10, maxMarks: 100 }, { subject: "Tamil", marks: 20, maxMarks: 100 }] }).errors.subjects)
  assert.ok(validateReportCard({ ...valid(), subjects: [{ subject: "Tamil", marks: 120, maxMarks: 100 }] }).errors.subjects)
  assert.ok(validateReportCard({ ...valid(), apaarId: "12" }).errors.apaarId)
  assert.ok(validateReportCard({ ...valid(), attendancePct: 150 }).errors.attendancePct)
  const e = validateReportCard(emptyReportCard()).errors
  assert.ok(e.student && e.classLevel && e.subjects)
})

function bulk(n: number): ReportCard[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `c${i}`, student: i % 2 ? `Asha ${i}` : `Bala ${i}`, apaarId: "", classLevel: i % 3 === 0 ? "X" : "IX",
    term: "Annual", subjects: subjects([60 + (i % 30), 55, 70, 65, 50]), attendancePct: 90, remarks: "",
    status: i % 2 ? "Published" : "Draft", createdAt: `2026-01-${String(i + 1).padStart(2, "0")}`, updatedAt: "2026-01-01",
  })) as ReportCard[]
}

test("queryReportCards filters by class/term/outcome/status and paginates", () => {
  const all = bulk(25)
  assert.ok(queryReportCards(all, { classLevel: "X" }).cards.every((c) => c.classLevel === "X"))
  assert.ok(queryReportCards(all, { status: "Published" }).cards.every((c) => c.status === "Published"))
  assert.ok(queryReportCards(all, { outcome: "Pass" }).cards.every((c) => reportTotals(c.subjects).outcome === "Pass"))
  const p = queryReportCards(all, { page: 1, pageSize: 10 })
  assert.equal(p.cards.length, 10)
  assert.equal(p.totalPages, 3)
})

test("store CRUD: create → read → update → delete (DB path, subjects round-trip)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createReportCard(valid())
  assert.match(created.id, /^RC-/)
  const got = await getReportCard(created.id)
  assert.equal(got?.subjects.length, 5)
  const updated = await updateReportCard(created.id, { ...valid(), status: "Draft", subjects: subjects([10, 10, 10, 10, 10]) })
  assert.equal(updated?.status, "Draft")
  assert.equal(reportTotals(updated!.subjects).outcome, "Fail")
  assert.equal(await deleteReportCard(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback is seeded; seedReportCards is idempotent", async () => {
  __setTestDb(null)
  const before = await listReportCards()
  assert.ok(before.length >= 6)
  assert.equal(await seedReportCards(), 6)
  assert.equal((await listReportCards()).length, before.length)
})
