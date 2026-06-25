import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { BUDGET } from "@/lib/finance"
import {
  BUDGET_PRIORITIES,
  headResolved,
  prioritisedBudget,
  prioritySummary,
  toCSV,
} from "@/lib/governance/budget-priorities"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("every priority maps to a real budget head and a real outcome module", () => {
  for (const p of BUDGET_PRIORITIES) {
    assert.ok(headResolved(p), `${p.head} not in budget`)
    assert.ok(BUDGET.some((b) => b.head === p.head))
    assert.ok(existsSync(join(repoRoot, p.outcomeRef)), `missing outcome module ${p.outcomeRef}`)
    assert.ok(["flagship", "high", "standard"].includes(p.tier))
  }
})

test("prioritised budget is flagship-first and shares sum to ~100%", () => {
  const rows = prioritisedBudget()
  assert.equal(rows[0].tier, "flagship") // flagship sorts first
  const totalShare = rows.reduce((s, r) => s + r.sharePct, 0)
  assert.ok(Math.abs(totalShare - 100) <= 2, `shares should ~sum to 100, got ${totalShare}`)
  // utilisation is spent/allocated
  for (const r of rows) {
    assert.ok(r.utilisationPct >= 0 && r.utilisationPct <= 100)
  }
})

test("summary tallies tiers, flagship share and total allocation", () => {
  const s = prioritySummary()
  assert.equal(s.priorities, BUDGET_PRIORITIES.length)
  assert.equal(s.flagship + s.high + s.standard, s.priorities)
  assert.equal(s.totalAllocated, BUDGET.reduce((n, b) => n + b.allocated, 0))
  assert.ok(s.flagshipSharePct > 0 && s.flagshipSharePct <= 100)
})

test("CSV has a header plus one row per priority", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Head,Tier,Allocated,Share %,Utilisation %,Rationale,Outcome module")
  assert.equal(lines.length, BUDGET_PRIORITIES.length + 1)
})
