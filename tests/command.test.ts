import { test } from "node:test"
import assert from "node:assert/strict"
import { dedupeByHref, filterCommandItems, type CommandItem } from "@/lib/command"

const items: CommandItem[] = [
  { title: "Dashboard", href: "/admin/dashboard" },
  { title: "Grievances", href: "/grievance" },
  { title: "School Registry (UDISE+)", href: "/school-registry" },
  { title: "System Self-Test", href: "/health" },
]

test("dedupeByHref drops duplicates and empty hrefs, keeps first-seen order", () => {
  const out = dedupeByHref([
    { title: "A", href: "/x" },
    { title: "A again", href: "/x" },
    { title: "No href", href: "" },
    { title: "B", href: "/y" },
  ])
  assert.deepEqual(out.map((i) => i.href), ["/x", "/y"])
})

test("filterCommandItems returns all items for an empty query", () => {
  assert.equal(filterCommandItems(items, "").length, items.length)
  assert.equal(filterCommandItems(items, "   ").length, items.length)
})

test("filterCommandItems matches on title (case-insensitive)", () => {
  const r = filterCommandItems(items, "grie")
  assert.equal(r.length, 1)
  assert.equal(r[0].href, "/grievance")
})

test("filterCommandItems matches on href", () => {
  const r = filterCommandItems(items, "/health")
  assert.equal(r.length, 1)
  assert.equal(r[0].title, "System Self-Test")
})

test("filterCommandItems caps results at the limit", () => {
  const many: CommandItem[] = Array.from({ length: 100 }, (_, i) => ({ title: `Item ${i}`, href: `/r/${i}` }))
  assert.equal(filterCommandItems(many, "item", 10).length, 10)
})
