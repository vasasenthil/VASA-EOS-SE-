import { test } from "node:test"
import assert from "node:assert/strict"
import { financeSummary } from "@/lib/finance"
import {
  DISTRICT_PROFILES,
  weightOf,
  allocate,
  allocationSummary,
  toCSV,
} from "@/lib/governance/resource-allocation"

const POOL = 1_000_000

test("need weight scales enrolment by the need index", () => {
  const d = { district: "x", schools: 1, enrolment: 1000, needIndex: 50 }
  assert.equal(weightOf(d), 1000 * 1.5)
})

test("allocation is need-weighted: higher need ⇒ higher per-student funding", () => {
  const rows = allocate(POOL)
  const nilgiris = rows.find((r) => r.district === "Nilgiris")! // needIndex 80 (highest)
  const chennai = rows.find((r) => r.district === "Chennai")! // needIndex 20 (lowest)
  assert.ok(nilgiris.perStudent > chennai.perStudent, "remote high-need district funded more per child")
})

test("shares ~sum to 100% and allocations ~sum to the pool", () => {
  const rows = allocate(POOL)
  const totalShare = rows.reduce((s, r) => s + r.sharePct, 0)
  assert.ok(Math.abs(totalShare - 100) <= 2, `shares ~100, got ${totalShare}`)
  const totalAlloc = rows.reduce((s, r) => s + r.allocated, 0)
  assert.ok(Math.abs(totalAlloc - POOL) <= rows.length, "allocations ~sum to pool (rounding)")
  // sorted largest allocation first
  for (let i = 1; i < rows.length; i++) assert.ok(rows[i - 1].allocated >= rows[i].allocated)
})

test("summary defaults the pool to the real budget total and is progressive", () => {
  const s = allocationSummary()
  assert.equal(s.pool, financeSummary().allocated) // grounded in the real budget
  assert.equal(s.districts, DISTRICT_PROFILES.length)
  assert.equal(s.totalEnrolment, DISTRICT_PROFILES.reduce((n, d) => n + d.enrolment, 0))
  assert.ok(s.progressivityRatio > 1, "per-student funding is progressive across need")
})

test("CSV has a header plus one row per district", () => {
  const lines = toCSV(POOL).split("\r\n").filter(Boolean)
  assert.equal(lines[0], "District,Schools,Enrolment,Need index,Share %,Allocated,Per student")
  assert.equal(lines.length, DISTRICT_PROFILES.length + 1)
})
