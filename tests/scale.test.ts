import { test } from "node:test"
import assert from "node:assert/strict"
import {
  TN_SCALE,
  ADMIN_TREE_TOTAL,
  buildAdminTree,
  treeCardinality,
  capacity,
  capacityModel,
  validateScale,
} from "@/lib/scale"

test("the administrative tree generates at true TN cardinality (~73k nodes)", () => {
  const tree = buildAdminTree()
  const card = treeCardinality(tree)
  assert.equal(card.school, TN_SCALE.schools) // 69,000
  assert.equal(card.cluster, TN_SCALE.clusters)
  assert.equal(card.block, TN_SCALE.blocks)
  assert.equal(card.district, TN_SCALE.districts)
  assert.equal(card.directorate, TN_SCALE.directorates)
  assert.equal(tree.length, ADMIN_TREE_TOTAL)
})

test("downward governance stays correct at full school cardinality", () => {
  const v = validateScale()
  assert.equal(v.ok, true, JSON.stringify(v.checks.filter((c) => !c.ok)))
  assert.ok(v.nodes > 70000)
  // explicit fail-closed checks are present and pass
  assert.ok(v.checks.find((c) => /cannot govern the state/.test(c.name))?.ok)
  assert.ok(v.checks.find((c) => /sibling schools are isolated/.test(c.name))?.ok)
})

test("capacity model is deterministic and arithmetic is sound", () => {
  const e = capacity({ label: "x", records: 12_700_000, bytesPerRecord: 2048, rowsPerShard: 5_000_000, indexFraction: 0.4 })
  assert.equal(e.records, 12_700_000)
  assert.equal(e.shards, 3) // ceil(12.7M / 5M)
  assert.equal(e.rawGB, 26.01) // 12.7e6 * 2048 / 1e9
  assert.equal(e.totalGB, Math.round((e.rawGB + e.indexGB) * 100) / 100)
  const model = capacityModel()
  assert.equal(model.length, 3)
  assert.ok(model.every((m) => m.totalGB > 0 && m.shards >= 1))
})
