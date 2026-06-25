import { test } from "node:test"
import assert from "node:assert/strict"
import {
  emptyWorks,
  validateWorks,
  isHighValue,
  isMandated,
  HIGH_VALUE_THRESHOLD,
  type WorksForm,
} from "@/lib/infrastructure/works"

function valid(): WorksForm {
  return { school: "GHSS Egmore", workType: "New classroom", estimatedCost: 850000, fundingSource: "Samagra Shiksha", justification: "Additional classroom to meet the RTE pupil-classroom ratio.", declaration: true }
}

test("an empty proposal fails with field errors", () => {
  const { ok, errors } = validateWorks(emptyWorks())
  assert.equal(ok, false)
  assert.ok(errors.school && errors.workType && errors.estimatedCost && errors.fundingSource && errors.justification && errors.declaration)
})

test("a complete valid proposal passes; short justification rejected", () => {
  assert.equal(validateWorks(valid()).ok, true)
  assert.ok(validateWorks({ ...valid(), justification: "too short" }).errors.justification)
  assert.ok(validateWorks({ ...valid(), estimatedCost: 0 }).errors.estimatedCost)
})

test("high-value routing triggers at the threshold", () => {
  assert.equal(isHighValue(valid()), false) // 8.5 lakh < 10 lakh
  assert.equal(isHighValue({ ...valid(), estimatedCost: HIGH_VALUE_THRESHOLD }), true)
})

test("RTE/RPwD-mandated work types are flagged", () => {
  assert.equal(isMandated({ ...valid(), workType: "Ramp / accessibility (RPwD)" }), true)
  assert.equal(isMandated({ ...valid(), workType: "Compound wall" }), false)
})
