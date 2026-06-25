import { test } from "node:test"
import assert from "node:assert/strict"
import {
  emptyTicket,
  validateTicket,
  completenessPct,
  type MaintTicketForm,
} from "@/lib/maintenance/ticket"

const ASOF = new Date("2026-06-10T00:00:00Z")

function valid(): MaintTicketForm {
  return {
    location: "Block B, Room 12", category: "Electrical", priority: "medium",
    description: "Two ceiling fans have stopped working since yesterday's storm.",
    reportedBy: "S. Ananthi", estimatedCost: 1500, preferredDate: "2026-06-20", safetyHazard: false, declaration: true,
  }
}

test("an empty ticket fails with field errors", () => {
  const { ok, errors } = validateTicket(emptyTicket(), ASOF)
  assert.equal(ok, false)
  assert.ok(errors.location && errors.category && errors.description && errors.reportedBy && errors.declaration)
})

test("a complete, valid ticket passes", () => {
  const { ok, errors } = validateTicket(valid(), ASOF)
  assert.equal(ok, true, JSON.stringify(errors))
})

test("a declared safety hazard must be high priority", () => {
  assert.match(validateTicket({ ...valid(), safetyHazard: true, priority: "medium" }, ASOF).errors.priority ?? "", /high priority/)
  assert.equal(validateTicket({ ...valid(), safetyHazard: true, priority: "high" }, ASOF).ok, true)
})

test("a short description and negative cost are rejected", () => {
  assert.ok(validateTicket({ ...valid(), description: "broken" }, ASOF).errors.description)
  assert.ok(validateTicket({ ...valid(), estimatedCost: -5 }, ASOF).errors.estimatedCost)
})

test("a preferred date cannot be in the past and must be valid", () => {
  assert.match(validateTicket({ ...valid(), preferredDate: "2020-01-01" }, ASOF).errors.preferredDate ?? "", /past/)
  assert.match(validateTicket({ ...valid(), preferredDate: "nonsense" }, ASOF).errors.preferredDate ?? "", /valid date/)
  // today is allowed; an omitted preferred date is allowed
  assert.equal(validateTicket({ ...valid(), preferredDate: "2026-06-10" }, ASOF).ok, true)
  assert.equal(validateTicket({ ...valid(), preferredDate: "" }, ASOF).ok, true)
})

test("completeness rises from low to 100", () => {
  assert.ok(completenessPct(emptyTicket()) < 40)
  assert.equal(completenessPct(valid()), 100)
})
