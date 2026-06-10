import { test } from "node:test"
import assert from "node:assert/strict"
import {
  CPGRAMS_CASES,
  CPGRAMS_SLA_DAYS,
  mapLocalStatus,
  daysPending,
  isOverdue,
  federationQueue,
  cpgramsSummary,
  toCSV,
} from "@/lib/grievance/cpgrams"

const NOW = new Date("2026-06-10T00:00:00Z")

test("the platform lifecycle maps onto the CPGRAMS lifecycle", () => {
  assert.equal(mapLocalStatus("open"), "Receipt")
  assert.equal(mapLocalStatus("in_progress"), "Under Examination")
  assert.equal(mapLocalStatus("escalated"), "Under Examination")
  assert.equal(mapLocalStatus("resolved"), "Disposed")
})

test("days pending counts from the forwarded date", () => {
  const recent = CPGRAMS_CASES.find((c) => c.registrationNo === "DOSEL/E/2026/0012500")! // 2026-06-06 → 4 days
  assert.equal(daysPending(recent, NOW), 4)
})

test("overdue = not disposed and past the 21-day norm", () => {
  const old = CPGRAMS_CASES.find((c) => c.localId === "GRV-1041")! // 2026-05-12 → 29 days, under examination
  assert.ok(daysPending(old, NOW) > CPGRAMS_SLA_DAYS)
  assert.equal(isOverdue(old, NOW), true)
  const disposed = CPGRAMS_CASES.find((c) => c.status === "Disposed")! // old but disposed
  assert.equal(isOverdue(disposed, NOW), false)
})

test("the federation queue excludes disposed cases, most overdue first", () => {
  const q = federationQueue(NOW)
  assert.ok(q.every((c) => c.status !== "Disposed"))
  for (let i = 1; i < q.length; i++) assert.ok(daysPending(q[i - 1], NOW) >= daysPending(q[i], NOW))
})

test("summary tallies disposal, pending and overdue honestly", () => {
  const s = cpgramsSummary(NOW)
  assert.equal(s.total, CPGRAMS_CASES.length)
  assert.equal(s.pending + s.disposed, s.total)
  assert.equal(s.disposed, 1)
  assert.equal(s.disposalRatePct, Math.round((1 / CPGRAMS_CASES.length) * 100))
  assert.ok(s.overdue >= 1)
})

test("CSV has a header plus one row per case", () => {
  const lines = toCSV(NOW).split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Registration No,Local ID,Ministry,Subject,Status,Days pending,Overdue")
  assert.equal(lines.length, CPGRAMS_CASES.length + 1)
})
