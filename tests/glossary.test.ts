import { test } from "node:test"
import assert from "node:assert/strict"
import {
  GLOSSARY,
  GLOSSARY_CATEGORIES,
  searchGlossary,
  filterByCategory,
  groupByCategory,
  sortByAbbr,
  lookup,
  glossarySummary,
} from "@/lib/glossary"

test("glossary is non-empty and every entry is well-formed", () => {
  assert.ok(GLOSSARY.length > 50)
  for (const e of GLOSSARY) {
    assert.ok(e.abbr.length > 0, "abbr present")
    assert.ok(e.expansion.length > 0, "expansion present")
    assert.ok(GLOSSARY_CATEGORIES.includes(e.category), `valid category for ${e.abbr}`)
  }
})

test("abbreviations are unique (case-insensitive)", () => {
  const seen = new Set<string>()
  for (const e of GLOSSARY) {
    const key = e.abbr.toLowerCase()
    assert.ok(!seen.has(key), `duplicate abbreviation: ${e.abbr}`)
    seen.add(key)
  }
})

test("search matches abbreviation, expansion and note, case-insensitively", () => {
  assert.equal(searchGlossary("apaar").length, 1)
  assert.ok(searchGlossary("mid-day meal").some((e) => e.abbr === "PM POSHAN" || e.abbr === "MDM"))
  // note-only match: PDP's note mentions "authorises"
  assert.ok(searchGlossary("authorise").some((e) => e.abbr === "PDP"))
})

test("empty query returns the whole set", () => {
  assert.equal(searchGlossary("").length, GLOSSARY.length)
  assert.equal(searchGlossary("   ").length, GLOSSARY.length)
})

test("filterByCategory narrows to one theme; empty returns all", () => {
  const tech = filterByCategory("Technology & Platform")
  assert.ok(tech.length > 0)
  assert.ok(tech.every((e) => e.category === "Technology & Platform"))
  assert.equal(filterByCategory("").length, GLOSSARY.length)
  assert.equal(filterByCategory(undefined).length, GLOSSARY.length)
})

test("groupByCategory preserves order and drops empty groups", () => {
  const groups = groupByCategory(filterByCategory("Roles & Hierarchy"))
  assert.equal(groups.length, 1)
  assert.equal(groups[0].category, "Roles & Hierarchy")
  // every returned group has at least one entry
  assert.ok(groups.every((g) => g.entries.length > 0))
})

test("sortByAbbr orders alphabetically without mutating input", () => {
  const input = filterByCategory("Roles & Hierarchy")
  const sorted = sortByAbbr(input)
  const labels = sorted.map((e) => e.abbr.toLowerCase())
  assert.deepEqual(labels, [...labels].sort())
  // original untouched
  assert.notEqual(sorted, input)
})

test("lookup finds by exact abbreviation, case-insensitive", () => {
  assert.equal(lookup("apaar")?.expansion, "Automated Permanent Academic Account Registry")
  assert.equal(lookup("RTE")?.category, "Policy & Governance")
  assert.equal(lookup("does-not-exist"), undefined)
})

test("summary counts total, categories and notes", () => {
  const s = glossarySummary()
  assert.equal(s.total, GLOSSARY.length)
  assert.equal(s.categories, GLOSSARY_CATEGORIES.length)
  assert.equal(s.withNotes, GLOSSARY.filter((e) => e.note).length)
})
