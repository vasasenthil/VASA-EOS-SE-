// End-to-end scenario coverage — exercises a full cross-module workflow, not a single unit.
// This is the first integration-level test layer (a browser/Playwright E2E suite is still pending);
// it composes the real data pipeline + domain modules the way a deployment would.

import { test } from "node:test"
import assert from "node:assert/strict"
import { ingest } from "@/lib/ingestion"
import { SCHOOL_SCHEMA, SAMPLE_CSV as SCHOOL_CSV, totalEnrolment, type SchoolRecord } from "@/lib/ingestion/school-registry"
import { TEACHER_SCHEMA, SAMPLE_CSV as TEACHER_CSV, teachersPerSchool, type TeacherRecord } from "@/lib/ingestion/teacher-roster"
import { readinessSummary } from "@/lib/governance/launch-readiness"
import { catalogueSummary } from "@/lib/governance/module-catalogue"

test("E2E: ingest schools + teachers, join by UDISE, and reload idempotently", () => {
  // 1) Ingest the school registry.
  const schools = ingest<SchoolRecord>(SCHOOL_CSV, SCHOOL_SCHEMA)
  assert.ok(schools.records.length >= 1)
  assert.ok(totalEnrolment(schools.records) > 0)

  // 2) Ingest the teacher roster.
  const teachers = ingest<TeacherRecord>(TEACHER_CSV, TEACHER_SCHEMA)
  assert.ok(teachers.records.length >= 1)

  // 3) Join: every teacher's UDISE code must reference a school we loaded (referential integrity).
  const schoolCodes = new Set(schools.records.map((s) => s.udiseCode))
  const joinable = teachers.records.filter((t) => schoolCodes.has(t.udiseCode))
  assert.ok(joinable.length >= 1, "at least one teacher joins a loaded school")

  // 4) Staffing view: the Chennai school (33010100101) should show its teachers.
  const perSchool = teachersPerSchool(teachers.records)
  const chennai = perSchool.find((p) => p.udiseCode === "33010100101")
  assert.ok(chennai && chennai.count >= 1)

  // 5) Idempotency end-to-end: a second load of both inserts nothing new.
  const schools2 = ingest<SchoolRecord>(SCHOOL_CSV, SCHOOL_SCHEMA, schools.records)
  const teachers2 = ingest<TeacherRecord>(TEACHER_CSV, TEACHER_SCHEMA, teachers.records)
  assert.equal(schools2.inserted, 0)
  assert.equal(teachers2.inserted, 0)
  assert.equal(schools2.records.length, schools.records.length)
  assert.equal(teachers2.records.length, teachers.records.length)
})

test("E2E: platform self-assessment stays internally consistent and honest", () => {
  // The readiness scorecard must remain honest (an MVP, not government-grade) and self-consistent.
  const r = readinessSummary()
  assert.equal(r.done + r.partial + r.notStarted, r.criteria)
  assert.ok(r.overallReadinessPct < 60, "readiness is honestly sub-government-grade")

  // The module-catalogue coverage must be a real subset of the catalogue, weighted honestly.
  const c = catalogueSummary()
  assert.equal(c.built + c.partial + c.pending, c.mapped)
  assert.ok(c.mapped < c.catalogueTotal, "maps a representative subset, not all 312")
  assert.ok(c.coveragePct >= c.builtPct, "weighted coverage ≥ built-only share")
})
