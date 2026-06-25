import { test } from "node:test"
import assert from "node:assert/strict"
import {
  emptyIndent,
  validateIndent,
  purchaseMode,
  isTender,
  DIRECT_PURCHASE_MAX,
  GEM_BID_MAX,
  type IndentForm,
} from "@/lib/procurement/indent"

function valid(): IndentForm {
  return { category: "Furniture", item: "40 dual-desk benches", quantity: 40, estimatedCost: 120000, fundingHead: "Samagra Shiksha", justification: "Additional seating for a new section.", declaration: true }
}

test("an empty indent fails with field errors", () => {
  const { ok, errors } = validateIndent(emptyIndent())
  assert.equal(ok, false)
  assert.ok(errors.category && errors.item && errors.estimatedCost && errors.fundingHead && errors.justification && errors.declaration)
})

test("a complete valid indent passes; non-positive quantity/cost rejected", () => {
  assert.equal(validateIndent(valid()).ok, true)
  assert.ok(validateIndent({ ...valid(), quantity: 0 }).errors.quantity)
  assert.ok(validateIndent({ ...valid(), estimatedCost: 0 }).errors.estimatedCost)
})

test("purchase mode follows the GeM/GFR value bands", () => {
  assert.equal(purchaseMode({ ...valid(), estimatedCost: DIRECT_PURCHASE_MAX }), "GeM direct purchase")
  assert.equal(purchaseMode({ ...valid(), estimatedCost: DIRECT_PURCHASE_MAX + 1 }), "GeM bid / RA")
  assert.equal(purchaseMode({ ...valid(), estimatedCost: GEM_BID_MAX }), "GeM bid / RA")
  assert.equal(purchaseMode({ ...valid(), estimatedCost: GEM_BID_MAX + 1 }), "Open tender")
})

test("tender band triggers Directorate approval above the GeM-bid ceiling", () => {
  assert.equal(isTender({ ...valid(), estimatedCost: GEM_BID_MAX }), false)
  assert.equal(isTender({ ...valid(), estimatedCost: GEM_BID_MAX + 1 }), true)
})
