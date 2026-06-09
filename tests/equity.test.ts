import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  EQUITY_DIMENSIONS,
  dimensionById,
  byStatus,
  articlesOperationalised,
  equitySummary,
  toCSV,
} from "@/lib/compliance/equity"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("all twelve equity dimensions are present and well-formed", () => {
  assert.equal(EQUITY_DIMENSIONS.length, 12)
  const ids = new Set<string>()
  for (const d of EQUITY_DIMENSIONS) {
    assert.ok(!ids.has(d.id), `duplicate ${d.id}`)
    ids.add(d.id)
    assert.ok(d.protects && d.articles.length >= 1)
    assert.ok(["implemented", "partial"].includes(d.status))
  }
  for (const id of ["caste", "community", "gender", "disability", "transgender", "tribal", "geographic", "economic", "linguistic", "religious", "age", "migrant"]) {
    assert.ok(dimensionById(id), `missing dimension ${id}`)
  }
})

test("every dimension's controlRef points at a real component (self-verifying)", () => {
  for (const d of EQUITY_DIMENSIONS) {
    assert.ok(existsSync(join(repoRoot, d.controlRef)), `${d.id} → missing component ${d.controlRef}`)
  }
})

test("constitutional articles are operationalised (incl. 21A, 46, 350A)", () => {
  const articles = articlesOperationalised()
  for (const a of ["15", "21A", "46", "350A"]) assert.ok(articles.includes(a), `Article ${a} missing`)
  assert.equal(dimensionById("disability")?.articles.includes("41"), true)
})

test("dimensions needing a dedicated module are honestly partial", () => {
  for (const id of ["transgender", "religious", "migrant"]) {
    assert.equal(dimensionById(id)?.status, "partial")
  }
  assert.ok(byStatus("implemented").length >= 6)
})

test("summary tallies dimensions, statuses and distinct articles", () => {
  const s = equitySummary()
  assert.equal(s.dimensions, 12)
  assert.equal(s.implemented + s.partial, s.dimensions)
  assert.equal(s.articles, articlesOperationalised().length)
})

test("CSV has a header plus one row per dimension", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Dimension,Protects,Articles,Component,Status")
  assert.equal(lines.length, EQUITY_DIMENSIONS.length + 1)
})
