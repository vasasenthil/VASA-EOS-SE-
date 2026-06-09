import { test } from "node:test"
import assert from "node:assert/strict"
import { CONCEPTS, learningPath, isReady, transitivePrerequisites, unlocks } from "@/lib/knowledge-graph"

test("learning path is topologically ordered (prereqs precede dependents)", () => {
  const path = learningPath("pct")
  const seen = new Set<string>()
  for (const c of path) {
    assert.ok(
      c.prerequisites.every((p) => seen.has(p)),
      `prerequisite of ${c.id} appears too late`,
    )
    seen.add(c.id)
  }
  assert.equal(path[path.length - 1]?.id, "pct")
})

test("every concept's path is non-empty (graph is acyclic & resolvable)", () => {
  for (const c of CONCEPTS) {
    assert.ok(learningPath(c.id).length > 0, `unresolvable: ${c.id}`)
  }
})

test("readiness gates on prerequisites", () => {
  assert.equal(isReady("add", new Set<string>()), false)
  assert.equal(isReady("add", new Set(["count"])), true)
})

test("transitive prerequisites include indirect ancestors", () => {
  const ids = transitivePrerequisites("pct").map((c) => c.id)
  assert.ok(ids.includes("frac"))
  assert.ok(ids.includes("count"))
})

test("unlocks reports direct dependents", () => {
  const ids = unlocks("count").map((c) => c.id)
  assert.ok(ids.includes("add"))
})
