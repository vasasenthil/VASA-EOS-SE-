import { test } from "node:test"
import assert from "node:assert/strict"
import { bktUpdate, selectNextItem, ITEM_BANK, MASTERY_THRESHOLD } from "@/lib/adaptive"

test("BKT rewards a correct response more than an incorrect one", () => {
  assert.ok(bktUpdate(0.3, true) > bktUpdate(0.3, false))
})

test("BKT stays within [0,1]", () => {
  for (const prior of [0, 0.2, 0.5, 0.85, 1]) {
    for (const correct of [true, false]) {
      const v = bktUpdate(prior, correct)
      assert.ok(v >= 0 && v <= 1, `out of range: ${v}`)
    }
  }
})

test("ZPD selection returns an in-skill item near the target difficulty", () => {
  const item = selectNextItem(ITEM_BANK, "frac", 0.3)
  assert.ok(item)
  assert.equal(item?.skillId, "frac")
  assert.ok((item?.difficulty ?? 0) >= 0.25 && (item?.difficulty ?? 1) <= 0.85)
})

test("selection returns undefined for an unknown skill", () => {
  assert.equal(selectNextItem(ITEM_BANK, "nope", 0.5), undefined)
})

test("mastery threshold is a sane probability", () => {
  assert.ok(MASTERY_THRESHOLD > 0.5 && MASTERY_THRESHOLD <= 1)
})
