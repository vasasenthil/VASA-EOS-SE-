import { test } from "node:test"
import assert from "node:assert/strict"
import { ingest } from "@/lib/ingestion"
import {
  TEACHER_SCHEMA,
  SAMPLE_CSV,
  teachersPerSchool,
  type TeacherRecord,
} from "@/lib/ingestion/teacher-roster"

test("the same engine loads a teacher roster, skipping the invalid row", () => {
  const r = ingest<TeacherRecord>(SAMPLE_CSV, TEACHER_SCHEMA)
  assert.equal(r.rows, 6)
  assert.equal(r.skipped, 1) // bad UDISE row
  assert.ok(r.errors.some((e) => e.column === "UDISE Code"))
  assert.equal(r.records.length, 4) // 4 distinct teacher IDs (the duplicate collapses)
})

test("a duplicate Teacher ID updates in place", () => {
  const r = ingest<TeacherRecord>(SAMPLE_CSV, TEACHER_SCHEMA)
  const t = r.records.find((x) => x.teacherId === "TR33010045")!
  assert.equal(t.designation, "Headmaster") // promoted in the second (duplicate) row
})

test("ingestion is idempotent for teachers too", () => {
  const first = ingest<TeacherRecord>(SAMPLE_CSV, TEACHER_SCHEMA)
  const second = ingest<TeacherRecord>(SAMPLE_CSV, TEACHER_SCHEMA, first.records)
  assert.equal(second.inserted, 0)
  assert.equal(second.records.length, first.records.length)
})

test("designation outside the controlled vocabulary is rejected", () => {
  const bad = "Teacher ID,Teacher Name,UDISE Code,District,Subject,Designation\nTR99999999,X,33010100101,Chennai,Maths,Professor"
  const r = ingest<TeacherRecord>(bad, TEACHER_SCHEMA)
  assert.ok(r.errors.some((e) => e.column === "Designation"))
  assert.equal(r.records.length, 0)
})

test("teachers join schools by UDISE code", () => {
  const r = ingest<TeacherRecord>(SAMPLE_CSV, TEACHER_SCHEMA)
  const per = teachersPerSchool(r.records)
  const chennai = per.find((p) => p.udiseCode === "33010100101")!
  assert.equal(chennai.count, 2) // two teachers at the Chennai school
})
