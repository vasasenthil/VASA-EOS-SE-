import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { AI_PILLARS, PILLAR_COUNT, pillarSummary } from "@/lib/ai/pillars"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("there are eight native-AI pillars", () => {
  assert.equal(PILLAR_COUNT, 8)
})

test("built/partial pillars cite real evidence; pending cite nothing (no overstatement)", () => {
  for (const p of AI_PILLARS) {
    if (p.status === "pending") {
      assert.equal(p.repoRef, "", `${p.id} pending but cites a ref`)
    } else {
      assert.notEqual(p.repoRef, "", `${p.id} claims ${p.status} but cites nothing`)
      assert.ok(existsSync(join(repoRoot, p.repoRef)), `${p.id} → missing evidence ${p.repoRef}`)
    }
  }
})

test("vision/document AI is honestly disclosed as pending", () => {
  assert.equal(AI_PILLARS.find((p) => p.id === "vision")?.status, "pending")
})

test("pillar coverage is an honest weighted figure under 100%", () => {
  const s = pillarSummary()
  assert.equal(s.total, 8)
  assert.equal(s.built + s.partial + s.pending, 8)
  assert.ok(s.coveragePct > 0 && s.coveragePct < 100)
})
