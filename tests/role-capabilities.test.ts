import { test } from "node:test"
import assert from "node:assert/strict"
import {
  roleCapabilitySummary,
  roleCapabilitiesToCSV,
  type RoleCapability,
} from "@/lib/governance/role-capabilities"

const SAMPLE: RoleCapability[] = [
  { id: "a", dimension: "general", responsibility: "A", featureRef: "lib/x.ts", route: "/x", status: "built" },
  { id: "b", dimension: "technical", responsibility: "B", featureRef: "lib/y.ts", route: "/y", status: "partial" },
  { id: "c", dimension: "functional", responsibility: "C, with comma", featureRef: "", route: "", status: "pending" },
]

test("summary tallies status, dimensions and builtPct", () => {
  const s = roleCapabilitySummary(SAMPLE)
  assert.equal(s.capabilities, 3)
  assert.equal(s.built, 1)
  assert.equal(s.partial, 1)
  assert.equal(s.pending, 1)
  assert.equal(s.builtPct, Math.round((1 / 3) * 100))
  assert.equal(s.general + s.technical + s.functional, 3)
})

test("empty input yields a zeroed summary (no divide-by-zero)", () => {
  const s = roleCapabilitySummary([])
  assert.equal(s.capabilities, 0)
  assert.equal(s.builtPct, 0)
})

test("CSV has the shared header, escapes commas, and renders pending as dashes", () => {
  const lines = roleCapabilitiesToCSV(SAMPLE).split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Dimension,Responsibility,Feature,Route,Status")
  assert.equal(lines.length, SAMPLE.length + 1)
  assert.match(lines[3], /"C, with comma"/) // comma-bearing field quoted
  assert.match(lines[3], /,—,—,pending$/) // pending → empty feature/route shown as dash
})
