import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  TRACE_MATRIX,
  traceSummary,
  byRole,
  filterByStatus,
  toCSV,
} from "@/lib/traceability"

const testsDir = dirname(fileURLToPath(import.meta.url))

test("every story is well-formed (id, role, story, route)", () => {
  const ids = new Set<string>()
  for (const i of TRACE_MATRIX) {
    assert.ok(i.id && !ids.has(i.id), `unique id: ${i.id}`)
    ids.add(i.id)
    assert.ok(i.role.length > 0)
    assert.ok(i.story.toLowerCase().startsWith("as "), `story phrasing: ${i.id}`)
    assert.ok(i.route.startsWith("/"))
    assert.ok(i.modules.length > 0)
  }
})

test("every referenced test file actually exists (self-verifying traceability)", () => {
  for (const i of TRACE_MATRIX) {
    for (const t of i.tests) {
      assert.ok(existsSync(join(testsDir, t)), `${i.id} references missing test ${t}`)
    }
  }
})

test("summary tallies status and coverage", () => {
  const s = traceSummary()
  assert.equal(s.total, TRACE_MATRIX.length)
  assert.equal(s.done + s.partial + s.planned, s.total)
  assert.ok(s.roles >= 12, "covers most stakeholder roles")
  assert.ok(s.coveragePct >= 95, "nearly every story has a covering test")
})

test("byRole groups and preserves order, with no empty groups", () => {
  const groups = byRole()
  assert.ok(groups.every((g) => g.items.length > 0))
  assert.equal(groups.reduce((n, g) => n + g.items.length, 0), TRACE_MATRIX.length)
})

test("filterByStatus narrows; 'all' returns everything", () => {
  assert.equal(filterByStatus("all").length, TRACE_MATRIX.length)
  assert.ok(filterByStatus("done").every((i) => i.status === "done"))
})

test("CSV has a header and one row per story, escaped", () => {
  const csv = toCSV()
  const lines = csv.split("\r\n").filter(Boolean)
  assert.equal(lines[0], "ID,Role,User story,Modules,Route,Tests,Status")
  assert.equal(lines.length, TRACE_MATRIX.length + 1)
  // Stories contain commas → must be quoted.
  assert.ok(csv.includes('"As a'))
})
