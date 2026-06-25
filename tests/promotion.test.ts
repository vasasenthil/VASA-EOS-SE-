import { test } from "node:test"
import assert from "node:assert/strict"
import { nextClass, resolveClass, promotionSummary, type PromotionRow } from "@/lib/promotion"

test("nextClass increments the class and graduates Class 12", () => {
  assert.equal(nextClass("Class 9-A"), "Class 10-A")
  assert.equal(nextClass("Class 11-C"), "Class 12-C")
  assert.equal(nextClass("Class 12-B"), "Graduated")
  assert.equal(nextClass("Pre-KG"), "Pre-KG") // no number -> unchanged
})

test("resolveClass respects the decision", () => {
  assert.equal(resolveClass("Class 7-B", "promote"), "Class 8-B")
  assert.equal(resolveClass("Class 7-B", "detain"), "Class 7-B")
})

test("summary counts promoted / detained / graduated", () => {
  const rows: PromotionRow[] = [
    { apaarId: "1", name: "A", from: "Class 9-A", decision: "promote" },
    { apaarId: "2", name: "B", from: "Class 12-A", decision: "promote" },
    { apaarId: "3", name: "C", from: "Class 9-A", decision: "detain" },
  ]
  const s = promotionSummary(rows)
  assert.equal(s.promoted, 2)
  assert.equal(s.detained, 1)
  assert.equal(s.graduated, 1)
})
