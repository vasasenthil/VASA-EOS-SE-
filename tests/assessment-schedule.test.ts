import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { summarise, ASSESSMENT_STATUSES, type ScheduledAssessment } from "@/lib/assessment-schedule"
import { scheduleAssessment, setAssessmentStatus, listAssessments, DEMO_UDISE } from "@/lib/assessment-schedule/store"

function items(): ScheduledAssessment[] {
  return [
    { subject: "Maths", cls: "X", type: "Unit Test", date: "Apr 2", status: "Scheduled" },
    { subject: "Science", cls: "IX", type: "Practical", date: "Apr 4", status: "Completed" },
    { subject: "English", cls: "All", type: "FA-2", date: "Apr 8", status: "Preparation" },
  ]
}

test("summarise counts upcoming vs completed", () => {
  const s = summarise(items())
  assert.equal(s.total, 3)
  assert.equal(s.completed, 1)
  assert.equal(s.upcoming, 2)
})

test("an empty schedule summarises to zeroes", () => {
  assert.deepEqual(summarise([]), { total: 0, upcoming: 0, completed: 0 })
})

test("the status vocabulary is stable", () => {
  assert.deepEqual([...ASSESSMENT_STATUSES], ["Scheduled", "Preparation", "Completed"])
})

test("scheduling and listing in creation order (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  await scheduleAssessment({ subject: "Maths", cls: "X", type: "Unit Test", date: "Apr 2", status: "Scheduled" })
  await scheduleAssessment({ subject: "Science", cls: "IX", type: "Practical", date: "Apr 4", status: "Scheduled" })
  const got = await listAssessments()
  assert.deepEqual(got.map((r) => r.subject), ["Maths", "Science"])
  __setTestDb(undefined)
})

test("an assessment status can be updated (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const rec = await scheduleAssessment({ subject: "Maths", cls: "X", type: "Unit Test", date: "Apr 2", status: "Scheduled" })
  assert.equal(await setAssessmentStatus(rec.id, "Completed"), true)
  const got = await listAssessments()
  assert.equal(got.find((r) => r.id === rec.id)?.status, "Completed")
  __setTestDb(undefined)
})

test("in-memory fallback is seeded and scoped; updating a missing id is false", async () => {
  __setTestDb(null)
  const got = await listAssessments(DEMO_UDISE)
  assert.equal(got.length, 4)
  assert.equal(await setAssessmentStatus("AS-NONE", "Completed"), false)
  assert.equal((await listAssessments("00000000000")).length, 0)
})
