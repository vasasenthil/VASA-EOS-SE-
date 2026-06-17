import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { emptyLessonPlan, validateLessonPlan, parseList, durationMinutes, isValidUrl, queryLessonPlans, type LessonPlan, type LessonPlanInput } from "@/lib/lessonplans"
import { listLessonPlans, getLessonPlan, createLessonPlan, updateLessonPlan, deleteLessonPlan, seedLessonPlans } from "@/lib/lessonplans/store"

function valid(): LessonPlanInput {
  return {
    classLevel: "X", section: "A", subject: "Mathematics", teacher: "Mr. Sharma", date: "2026-06-30", period: 2,
    startTime: "09:45", endTime: "10:30", lessonType: "Theory", topic: "Quadratics", objectives: "Solve by factorisation.",
    previousTopics: ["Linear equations"], furtherTopics: ["Quadratic formula"], materialsToBring: ["Textbook"],
    homework: "Ex 4.2", lessonPlannerLink: "https://diksha.gov.in/x", classNotes: [{ kind: "Video", title: "Walkthrough", url: "https://diksha.gov.in/v" }], status: "Planned",
  }
}

test("parseList trims, drops empties and dedupes (case-insensitive)", () => {
  assert.deepEqual(parseList("Algebra, Geometry , algebra,, Trig"), ["Algebra", "Geometry", "Trig"])
  assert.deepEqual(parseList(""), [])
})

test("durationMinutes and isValidUrl", () => {
  assert.equal(durationMinutes("09:45", "10:30"), 45)
  assert.equal(durationMinutes("10:00", "09:00"), 0) // end before start
  assert.equal(durationMinutes("bad", "10:00"), 0)
  assert.equal(isValidUrl("https://x.gov.in/a"), true)
  assert.equal(isValidUrl("ftp://x"), false)
})

test("validation: required fields, time order, URL fields, class-note shape", () => {
  assert.equal(validateLessonPlan(valid()).ok, true)
  assert.ok(validateLessonPlan({ ...valid(), endTime: "09:00" }).errors.endTime)
  assert.ok(validateLessonPlan({ ...valid(), period: 0 }).errors.period)
  assert.ok(validateLessonPlan({ ...valid(), lessonPlannerLink: "notaurl" }).errors.lessonPlannerLink)
  assert.ok(validateLessonPlan({ ...valid(), classNotes: [{ kind: "Video", title: "", url: "bad" }] }).errors.classNotes)
  const e = validateLessonPlan(emptyLessonPlan()).errors
  assert.ok(e.classLevel && e.subject && e.teacher && e.date && e.topic)
})

function bulk(n: number): LessonPlan[] {
  return Array.from({ length: n }, (_, i) => ({
    ...valid(), id: `p${i}`, classLevel: i % 3 === 0 ? "X" : "IX", subject: i % 2 ? "Mathematics" : "Science",
    lessonType: i % 2 ? "Theory" : "Practical", topic: `Topic ${i}`, date: `2026-06-${String((i % 28) + 1).padStart(2, "0")}`,
    createdAt: `2026-06-${String((i % 28) + 1).padStart(2, "0")}`, updatedAt: "2026-06-01",
  })) as LessonPlan[]
}

test("queryLessonPlans filters by class/subject/type and paginates", () => {
  const all = bulk(20)
  assert.ok(queryLessonPlans(all, { classLevel: "X" }).plans.every((p) => p.classLevel === "X"))
  assert.ok(queryLessonPlans(all, { lessonType: "Practical" }).plans.every((p) => p.lessonType === "Practical"))
  const p = queryLessonPlans(all, { page: 1, pageSize: 9 })
  assert.equal(p.plans.length, 9)
  assert.equal(p.totalPages, 3)
})

test("store CRUD: create → read → update → delete (DB path, arrays + notes round-trip)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createLessonPlan(valid())
  assert.match(created.id, /^LP-/)
  const got = await getLessonPlan(created.id)
  assert.equal(got?.previousTopics.length, 1)
  assert.equal(got?.classNotes[0]?.kind, "Video")
  const updated = await updateLessonPlan(created.id, { ...valid(), status: "Delivered", materialsToBring: ["A", "B"] })
  assert.equal(updated?.status, "Delivered")
  assert.equal(updated?.materialsToBring.length, 2)
  assert.equal(await deleteLessonPlan(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback is seeded; seedLessonPlans is idempotent", async () => {
  __setTestDb(null)
  const before = await listLessonPlans()
  assert.ok(before.length >= 3)
  const n = await seedLessonPlans()
  assert.equal(n, 3)
  assert.equal((await listLessonPlans()).length, before.length)
})
