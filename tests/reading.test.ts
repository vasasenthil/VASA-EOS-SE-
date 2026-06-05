import { test } from "node:test"
import assert from "node:assert/strict"
import { nextReadingLevel, readingSummary, READING_LEVELS, type Reader } from "@/lib/reading"

const r = (level: Reader["level"], booksRead = 2): Reader => ({
  id: `r-${Math.random()}`,
  student: "N",
  cls: "3A",
  level,
  booksRead,
})

test("level advances through the bands and clamps at Story", () => {
  assert.equal(nextReadingLevel("Beginner"), "Letter")
  assert.equal(nextReadingLevel("Word"), "Paragraph")
  assert.equal(nextReadingLevel("Paragraph"), "Story")
  assert.equal(nextReadingLevel("Story"), "Story")
})

test("five ASER bands in order", () => {
  assert.deepEqual(READING_LEVELS, ["Beginner", "Letter", "Word", "Paragraph", "Story"])
})

test("summary counts fluent readers, books and fluent rate", () => {
  const s = readingSummary([r("Story", 5), r("Word", 1), r("Story", 2), r("Beginner", 0)])
  assert.equal(s.students, 4)
  assert.equal(s.fluent, 2)
  assert.equal(s.booksRead, 8)
  assert.equal(s.fluentPct, 50)
})

test("empty class yields zero fluent rate", () => {
  assert.equal(readingSummary([]).fluentPct, 0)
})
