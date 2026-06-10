import { test } from "node:test"
import assert from "node:assert/strict"
import { ingest } from "@/lib/ingestion"
import {
  SCHOOL_SCHEMA,
  SAMPLE_CSV,
  districtsOf,
  totalEnrolment,
  type SchoolRecord,
} from "@/lib/ingestion/school-registry"

test("the sample loads valid schools, skips the invalid row, and maps fields", () => {
  const r = ingest<SchoolRecord>(SAMPLE_CSV, SCHOOL_SCHEMA)
  // 6 data rows: 4 distinct valid + 1 invalid (bad UDISE) + 1 duplicate of the first
  assert.equal(r.rows, 6)
  assert.equal(r.skipped, 1) // the ABC10100999 row
  assert.ok(r.errors.some((e) => e.column === "UDISE Code" && /11 digits/.test(e.message)))
  // 4 distinct UDISE codes survive (the duplicate collapses onto the first)
  assert.equal(r.records.length, 4)
  const chennai = r.records.find((s) => s.udiseCode === "33010100101")!
  assert.equal(chennai.district, "Chennai")
  assert.equal(typeof chennai.enrolment, "number")
})

test("a duplicate UDISE code updates in place (the second occurrence wins)", () => {
  const r = ingest<SchoolRecord>(SAMPLE_CSV, SCHOOL_SCHEMA)
  const chennai = r.records.find((s) => s.udiseCode === "33010100101")!
  // sample row 1 had 1248; the duplicate row updated it to 1305
  assert.equal(chennai.enrolment, 1305)
  assert.equal(chennai.name, "GHSS Anna Nagar (updated roll)")
})

test("ingestion is idempotent: re-loading the same export inserts nothing new", () => {
  const first = ingest<SchoolRecord>(SAMPLE_CSV, SCHOOL_SCHEMA)
  const second = ingest<SchoolRecord>(SAMPLE_CSV, SCHOOL_SCHEMA, first.records)
  assert.equal(second.inserted, 0, "no new schools on a repeat load")
  assert.ok(second.updated >= 1)
  assert.equal(second.records.length, first.records.length, "record count is stable")
})

test("a real export merges with existing records by UDISE code", () => {
  const existing: SchoolRecord[] = [
    { udiseCode: "33990099001", name: "Existing School", district: "Theni", block: "Theni", category: "Primary", management: "Government" },
  ]
  const r = ingest<SchoolRecord>(SAMPLE_CSV, SCHOOL_SCHEMA, existing)
  assert.equal(r.inserted, 4) // 4 new distinct schools
  assert.ok(r.records.some((s) => s.udiseCode === "33990099001")) // existing preserved
  assert.equal(r.records.length, 5)
})

test("a missing required column is a fatal mapping error (nothing loaded)", () => {
  const bad = "School Name,District\nFoo,Chennai"
  const r = ingest<SchoolRecord>(bad, SCHOOL_SCHEMA)
  assert.ok(r.errors.some((e) => e.column === "UDISE Code" && /missing from header/.test(e.message)))
  assert.equal(r.inserted, 0)
  assert.equal(r.records.length, 0)
})

test("helpers summarise the loaded set", () => {
  const r = ingest<SchoolRecord>(SAMPLE_CSV, SCHOOL_SCHEMA)
  assert.deepEqual(districtsOf(r.records), ["Chennai", "Coimbatore", "Madurai"])
  assert.equal(totalEnrolment(r.records), 1305 + 640 + 210 + 980)
})
