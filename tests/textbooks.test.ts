import { test } from "node:test"
import assert from "node:assert/strict"
import { textbookSummary, pendingOf, type Indent } from "@/lib/textbooks"

const i = (required: number, received: number): Indent => ({
  id: `i-${Math.random()}`,
  cls: "5",
  subject: "Maths",
  required,
  received,
  tenantId: "TN-CHN-B1-S1",
})

test("pending never goes negative", () => {
  assert.equal(pendingOf(i(100, 60)), 40)
  assert.equal(pendingOf(i(100, 120)), 0)
})

test("summary totals required, received (capped) and pending", () => {
  const s = textbookSummary([i(100, 60), i(50, 50), i(40, 99)])
  assert.equal(s.titles, 3)
  assert.equal(s.required, 190)
  assert.equal(s.received, 150) // 60 + 50 + min(99,40)
  assert.equal(s.pending, 40)
  assert.equal(s.fulfilmentPct, 79)
})

test("empty indent yields zero fulfilment", () => {
  assert.equal(textbookSummary([]).fulfilmentPct, 0)
})
