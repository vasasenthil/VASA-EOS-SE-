import { test } from "node:test"
import assert from "node:assert/strict"
import { ingest } from "@/lib/ingestion"
import {
  STUDENT_SCHEMA,
  SAMPLE_CSV,
  byCategory,
  cwsnCount,
  type StudentRecord,
} from "@/lib/ingestion/student-enrolment"

test("the same engine loads students, skipping the invalid APAAR row", () => {
  const r = ingest<StudentRecord>(SAMPLE_CSV, STUDENT_SCHEMA)
  assert.equal(r.rows, 6)
  assert.equal(r.skipped, 1)
  assert.ok(r.errors.some((e) => e.column === "APAAR ID" && /12 digits/.test(e.message)))
  assert.equal(r.records.length, 4) // 4 distinct APAAR ids
})

test("a duplicate APAAR id updates the child in place (grade promotion)", () => {
  const r = ingest<StudentRecord>(SAMPLE_CSV, STUDENT_SCHEMA)
  const arun = r.records.find((s) => s.apaarId === "100200300401")!
  assert.equal(arun.grade, 10) // promoted from 9 to 10 in the duplicate row
})

test("idempotent for students too", () => {
  const first = ingest<StudentRecord>(SAMPLE_CSV, STUDENT_SCHEMA)
  const second = ingest<StudentRecord>(SAMPLE_CSV, STUDENT_SCHEMA, first.records)
  assert.equal(second.inserted, 0)
  assert.equal(second.records.length, first.records.length)
})

test("category and CWSN summaries are derived from the loaded set", () => {
  const r = ingest<StudentRecord>(SAMPLE_CSV, STUDENT_SCHEMA)
  const cats = byCategory(r.records)
  assert.equal(cats.reduce((n, c) => n + c.count, 0), r.records.length)
  assert.equal(cwsnCount(r.records), 1) // Karthik R
})

test("an invalid social category is rejected", () => {
  const bad = "APAAR ID,Student Name,UDISE Code,Grade,Gender,Social Category\n100200300999,X,33010100101,9,Male,VIP"
  const r = ingest<StudentRecord>(bad, STUDENT_SCHEMA)
  assert.ok(r.errors.some((e) => e.column === "Social Category"))
  assert.equal(r.records.length, 0)
})
