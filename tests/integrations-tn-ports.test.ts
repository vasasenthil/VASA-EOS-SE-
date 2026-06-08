import { test } from "node:test"
import assert from "node:assert/strict"
import { mockEmis, mockPortal, mockExams } from "@/lib/integrations/mock"
import { liveEmis } from "@/lib/integrations/live/emis"
import { livePortal } from "@/lib/integrations/live/portal"
import { liveExams } from "@/lib/integrations/live/exams"
import { integrationStatuses } from "@/lib/integrations/status"

// ── Mock adapters: deterministic, mode="mock" ────────────────────────────────
test("mock EMIS returns school master data", async () => {
  const r = await mockEmis.getSchoolData("33010100101")
  assert.equal(r.ok, true)
  assert.equal(r.mode, "mock")
  assert.equal(r.data?.udiseCode, "33010100101")
  assert.ok((r.data?.teachers ?? 0) > 0)
  assert.equal((await mockEmis.pushEnrolment({ udiseCode: "x", apaarId: "a", className: "5" })).ok, true)
})

test("mock TN Schools Portal publishes and lists", async () => {
  const r = await mockPortal.publish({ kind: "notice", title: "Holiday" })
  assert.equal(r.ok, true)
  assert.match(r.data?.url ?? "", /tnschools\.gov\.in/)
  assert.equal((await mockPortal.listPublished()).ok, true)
})

test("mock Exam board registers and fetches", async () => {
  const reg = await mockExams.registerCandidates({ examCode: "SSLC", udiseCode: "x", count: 120 })
  assert.match(reg.data?.batchId ?? "", /^BATCH-/)
  const res = await mockExams.fetchResults("SSLC")
  assert.equal(res.data?.examCode, "SSLC")
})

// ── Live adapters: fail closed when unconfigured (never throw) ────────────────
test("live TN ports return a typed error when base URL is unconfigured", async () => {
  const a = await liveEmis.getSchoolData("x")
  assert.equal(a.ok, false)
  assert.equal(a.mode, "live")
  assert.match(a.error ?? "", /not configured/)
  assert.equal((await livePortal.publish({ kind: "n", title: "t" })).ok, false)
  assert.equal((await liveExams.fetchResults("SSLC")).ok, false)
})

// ── Status surfaces the three new ports ──────────────────────────────────────
test("status lists EMIS, TN Schools Portal and Exam Systems", () => {
  const keys = integrationStatuses().map((r) => r.key)
  for (const k of ["emis", "portal", "exams"]) assert.ok(keys.includes(k), `missing ${k}`)
})
