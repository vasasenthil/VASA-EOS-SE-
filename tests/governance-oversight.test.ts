import { test } from "node:test"
import assert from "node:assert/strict"
import {
  summarizeOversight,
  rollupByFlow,
  pendingByRole,
  ageBucketFor,
  agingProfile,
  AGE_BUCKETS,
  oversightToCSV,
  type OversightItem,
} from "@/lib/governance/oversight"

function item(over: Partial<OversightItem> = {}): OversightItem {
  return {
    flowId: "leave-approval",
    flowLabel: "Teacher Leave Approval",
    recordId: "r1",
    title: "Asha — CL (2d)",
    status: "in_progress",
    currentRole: "PRINCIPAL",
    currentStepName: "Headmaster",
    pct: 33,
    updatedAt: "",
    ...over,
  }
}

test("summary counts statuses and active share", () => {
  const s = summarizeOversight([
    item({ status: "in_progress" }),
    item({ status: "in_progress" }),
    item({ status: "approved" }),
    item({ status: "rejected" }),
  ])
  assert.equal(s.total, 4)
  assert.equal(s.inProgress, 2)
  assert.equal(s.approved, 1)
  assert.equal(s.rejected, 1)
  assert.equal(s.activePct, 50)
})

test("summary of empty set is all zero (no divide-by-zero)", () => {
  const s = summarizeOversight([])
  assert.deepEqual(s, { total: 0, inProgress: 0, approved: 0, rejected: 0, activePct: 0 })
})

test("rollupByFlow groups per process, sorted by in-progress then total", () => {
  const rows = rollupByFlow([
    item({ flowId: "leave-approval", flowLabel: "Leave", status: "approved" }),
    item({ flowId: "grievance-escalation", flowLabel: "Grievance", status: "in_progress" }),
    item({ flowId: "grievance-escalation", flowLabel: "Grievance", status: "in_progress" }),
  ])
  assert.equal(rows[0].flowId, "grievance-escalation") // 2 in-progress wins
  assert.equal(rows[0].inProgress, 2)
  assert.equal(rows[1].flowId, "leave-approval")
  assert.equal(rows[1].approved, 1)
})

test("pendingByRole counts in-progress only, sorted desc", () => {
  const rows = pendingByRole([
    item({ status: "in_progress", currentRole: "BEO" }),
    item({ status: "in_progress", currentRole: "BEO" }),
    item({ status: "in_progress", currentRole: "DEO" }),
    item({ status: "approved", currentRole: "DEO" }), // ignored (finished)
    item({ status: "in_progress", currentRole: null }), // ignored (no role)
  ])
  assert.deepEqual(rows, [
    { role: "BEO", count: 2 },
    { role: "DEO", count: 1 },
  ])
})

test("ageBucketFor classifies by days; bad/empty input → unknown", () => {
  const now = Date.parse("2026-06-07T12:00:00.000Z")
  assert.equal(ageBucketFor(new Date(now - 12 * 3600_000).toISOString(), now), "≤1 day")
  assert.equal(ageBucketFor(new Date(now - 2 * 86_400_000).toISOString(), now), "1–3 days")
  assert.equal(ageBucketFor(new Date(now - 5 * 86_400_000).toISOString(), now), "3–7 days")
  assert.equal(ageBucketFor(new Date(now - 30 * 86_400_000).toISOString(), now), ">7 days")
  assert.equal(ageBucketFor("", now), "unknown")
  assert.equal(ageBucketFor("not-a-date", now), "unknown")
})

test("agingProfile buckets only in-progress items and returns every bucket", () => {
  const now = Date.parse("2026-06-07T12:00:00.000Z")
  const rows = agingProfile(
    [
      item({ status: "in_progress", updatedAt: new Date(now - 10 * 86_400_000).toISOString() }),
      item({ status: "in_progress", updatedAt: "" }),
      item({ status: "approved", updatedAt: new Date(now - 10 * 86_400_000).toISOString() }), // ignored
    ],
    now,
  )
  assert.deepEqual(rows.map((r) => r.bucket), AGE_BUCKETS)
  assert.equal(rows.find((r) => r.bucket === ">7 days")?.count, 1)
  assert.equal(rows.find((r) => r.bucket === "unknown")?.count, 1)
})

test("oversightToCSV emits a header plus one CRLF row per item, escaped", () => {
  const csv = oversightToCSV([item({ title: 'has, comma "q"' })])
  const lines = csv.split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Process,Record,Title,Status,Awaiting role,Current step,Percent,Updated")
  assert.match(lines[1], /"has, comma ""q"""/)
  assert.ok(csv.endsWith("\r\n"))
})
