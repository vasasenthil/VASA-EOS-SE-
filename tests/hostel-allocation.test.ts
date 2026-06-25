import { test } from "node:test"
import assert from "node:assert/strict"
import {
  HOSTELS,
  APPLICANTS,
  vacancy,
  occupancyPct,
  priorityScore,
  allocate,
  hostelSummary,
  toCSV,
} from "@/lib/hostel/allocation"

test("vacancy and occupancy derive from capacity and occupied", () => {
  const mdu = HOSTELS.find((h) => h.id === "H-MDU-B1")! // 100 cap, 99 occ
  assert.equal(vacancy(mdu), 1)
  assert.equal(occupancyPct(mdu), 99)
  const full = HOSTELS.find((h) => h.id === "H-TNV-G1")! // 80/80
  assert.equal(vacancy(full), 0)
})

test("priority score weights social category and distance (need-first)", () => {
  const stFar = APPLICANTS.find((a) => a.studentId === "S-7001")! // ST 28km → 3+2 = 5
  const obcNear = APPLICANTS.find((a) => a.studentId === "S-7003")! // OBC 6km → 1+0 = 1
  assert.equal(priorityScore(stFar), 5)
  assert.equal(priorityScore(obcNear), 1)
  assert.ok(priorityScore(stFar) > priorityScore(obcNear))
})

test("scarce seats go to the highest-need applicant; the rest are waitlisted", () => {
  const alloc = allocate()
  // only 1 boys seat + 1 girls seat are free → 2 allotted, 5 waitlisted
  const allotted = alloc.filter((r) => r.outcome === "allotted")
  assert.equal(allotted.length, 2)
  assert.equal(alloc.filter((r) => r.outcome === "waitlisted").length, 5)
  // the boys seat goes to the highest-scoring boy (S-7001, ST 28km)
  const boy = allotted.find((r) => r.applicant.type === "Boys")!
  assert.equal(boy.applicant.studentId, "S-7001")
  // never over-allocate a hostel beyond its vacancy
  assert.ok(allotted.every((r) => r.hostelId))
})

test("an allocation never exceeds a hostel's vacancy", () => {
  const alloc = allocate()
  for (const h of HOSTELS) {
    const assigned = alloc.filter((r) => r.hostelId === h.id).length
    assert.ok(assigned <= vacancy(h), `${h.id} over-allocated`)
  }
})

test("summary tallies capacity, occupancy and allocation outcomes", () => {
  const s = hostelSummary()
  assert.equal(s.hostels, HOSTELS.length)
  assert.equal(s.totalCapacity, HOSTELS.reduce((n, h) => n + h.capacity, 0))
  assert.equal(s.allotted + s.waitlisted, s.applicants)
  assert.equal(s.totalVacancy, 2)
})

test("CSV has a header plus one row per applicant", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Student,Type,Category,Distance km,Score,Outcome,Hostel")
  assert.equal(lines.length, APPLICANTS.length + 1)
})
