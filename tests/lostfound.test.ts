import { test } from "node:test"
import assert from "node:assert/strict"
import { lostFoundSummary, filterByStatus, type LostItem } from "@/lib/lostfound"

const i = (status: LostItem["status"]): LostItem => ({
  id: `i-${Math.random()}`,
  name: "Water bottle",
  description: "blue",
  location: "Playground",
  reportedBy: "R",
  status,
  date: "2026-06-05",
  tenantId: "TN-CHN-B1-S1",
})

test("summary tallies by status", () => {
  const s = lostFoundSummary([i("lost"), i("found"), i("found"), i("claimed")])
  assert.equal(s.total, 4)
  assert.equal(s.lost, 1)
  assert.equal(s.found, 2)
  assert.equal(s.claimed, 1)
  assert.equal(s.openFound, 2)
})

test("filter narrows by status and 'all' returns everything", () => {
  const items = [i("lost"), i("found"), i("claimed")]
  assert.equal(filterByStatus(items, "found").length, 1)
  assert.equal(filterByStatus(items, "all").length, 3)
})
