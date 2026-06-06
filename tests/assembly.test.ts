import { test } from "node:test"
import assert from "node:assert/strict"
import { assemblySummary, ASSEMBLY_THEMES, type Assembly } from "@/lib/assembly"

const a = (date: string, cls: string, theme: string): Assembly => ({
  id: `a-${Math.random()}`,
  date,
  cls,
  theme,
  conductedBy: "Teacher",
  thought: "t",
})

test("theme catalogue is non-empty", () => {
  assert.ok(ASSEMBLY_THEMES.includes("Patriotism"))
})

test("summary counts distinct classes, themes and days", () => {
  const s = assemblySummary([
    a("2026-06-01", "8A", "Patriotism"),
    a("2026-06-01", "8B", "Patriotism"),
    a("2026-06-02", "8A", "Gratitude & kindness"),
  ])
  assert.equal(s.total, 3)
  assert.equal(s.classes, 2)
  assert.equal(s.themes, 2)
  assert.equal(s.days, 2)
})
