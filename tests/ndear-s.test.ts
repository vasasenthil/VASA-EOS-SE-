import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  NDEAR_S_BLOCKS,
  NDEAR_S_CATEGORIES,
  NDEAR_S_TOTAL,
  byCategory,
  ndearSSummary,
  toCSV,
} from "@/lib/integrations/ndear-s"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("there are exactly 29 NDEAR-S building blocks, numbered 1..29", () => {
  assert.equal(NDEAR_S_BLOCKS.length, NDEAR_S_TOTAL)
  assert.deepEqual(NDEAR_S_BLOCKS.map((b) => b.n).sort((a, b) => a - b), Array.from({ length: 29 }, (_, i) => i + 1))
})

test("every block cites a component that exists on disk (no overstatement)", () => {
  for (const b of NDEAR_S_BLOCKS) {
    if (b.status === "pending") {
      assert.equal(b.componentRef, "", `${b.id} pending but cites a ref`)
    } else {
      assert.notEqual(b.componentRef, "", `${b.id} claims ${b.status} but cites nothing`)
      assert.ok(existsSync(join(repoRoot, b.componentRef)), `${b.id} → missing component ${b.componentRef}`)
    }
  }
})

test("every category is represented and ids are unique", () => {
  for (const c of NDEAR_S_CATEGORIES) assert.ok(byCategory(c).length >= 1, `empty category ${c}`)
  assert.equal(new Set(NDEAR_S_BLOCKS.map((b) => b.id)).size, 29)
})

test("federation registries are honestly held as live-ready seams, not re-implemented", () => {
  for (const id of ["learner-id", "institution-registry", "content-backbone", "dbt", "credentials"]) {
    assert.equal(NDEAR_S_BLOCKS.find((b) => b.id === id)?.status, "federated-seam", `${id} should be a federated seam`)
  }
})

test("summary reports 29/29 addressed with an honest built share", () => {
  const s = ndearSSummary()
  assert.equal(s.total, 29)
  assert.equal(s.aligned, true) // all 29 addressed
  assert.equal(s.built + s.federatedSeam + s.pending, 29)
  assert.ok(s.builtPct > 0 && s.builtPct < 100, "built share is a candid figure, not 100%")
})

test("CSV export has a header row and one row per block", () => {
  assert.equal(toCSV().split("\n").length, 30)
})
