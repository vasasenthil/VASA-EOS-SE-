import { test } from "node:test"
import assert from "node:assert/strict"
import { safeDate } from "@/lib/format-date"

test("formats a valid date string", () => {
  assert.equal(safeDate("2026-04-15T10:30:00.000Z", "yyyy-MM-dd"), "2026-04-15")
})

test("formats a Date instance", () => {
  assert.equal(safeDate(new Date("2026-01-02T00:00:00.000Z"), "yyyy-MM-dd"), "2026-01-02")
})

test("returns the fallback for null/undefined/empty (no throw)", () => {
  assert.equal(safeDate(null, "yyyy-MM-dd"), "N/A")
  assert.equal(safeDate(undefined, "yyyy-MM-dd"), "N/A")
  assert.equal(safeDate("", "yyyy-MM-dd"), "N/A")
})

test("returns the fallback for an unparseable date instead of throwing", () => {
  // This is the exact input that crashed the pages: new Date("not-a-date") is Invalid Date,
  // and date-fns format() would throw RangeError: Invalid time value.
  assert.doesNotThrow(() => safeDate("not-a-date", "yyyy-MM-dd"))
  assert.equal(safeDate("not-a-date", "yyyy-MM-dd"), "N/A")
  assert.equal(safeDate(Number.NaN, "yyyy-MM-dd"), "N/A")
})

test("honours a custom fallback", () => {
  assert.equal(safeDate(null, "yyyy-MM-dd", "—"), "—")
})
