import { test } from "node:test"
import assert from "node:assert/strict"
import { disciplineSummary, INCIDENT_TYPES, type Incident } from "@/lib/discipline"

const i = (over: Partial<Incident>): Incident => ({ id: "i", student: "A", type: "Misconduct", severity: "minor", action: "", date: "2026-06-01", status: "open", ...over })

test("incident types are defined", () => {
  assert.ok(INCIDENT_TYPES.length >= 4)
})

test("summary counts open/resolved and serious", () => {
  const list = [
    i({ id: "a", status: "open", severity: "serious" }),
    i({ id: "b", status: "resolved", severity: "minor" }),
    i({ id: "c", status: "open", severity: "moderate" }),
  ]
  const s = disciplineSummary(list)
  assert.equal(s.total, 3)
  assert.equal(s.open, 2)
  assert.equal(s.resolved, 1)
  assert.equal(s.serious, 1)
})
