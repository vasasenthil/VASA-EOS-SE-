import { test } from "node:test"
import assert from "node:assert/strict"
import { nextReadingLevel, levelIndex, remedialSummary, type RemedialStudent } from "@/lib/remedial"

test("levels advance up the ladder and stop at Story", () => {
  assert.equal(nextReadingLevel("Beginner"), "Letter")
  assert.equal(nextReadingLevel("Word"), "Paragraph")
  assert.equal(nextReadingLevel("Paragraph"), "Story")
  assert.equal(nextReadingLevel("Story"), "Story")
})

test("levelIndex orders the ladder", () => {
  assert.equal(levelIndex("Beginner"), 0)
  assert.equal(levelIndex("Story"), 4)
})

test("summary counts needs-support, at-Story and average level", () => {
  const list: RemedialStudent[] = [
    { id: "1", name: "A", level: "Beginner" },
    { id: "2", name: "B", level: "Word" },
    { id: "3", name: "C", level: "Story" },
  ]
  const s = remedialSummary(list)
  assert.equal(s.total, 3)
  assert.equal(s.needsSupport, 1)
  assert.equal(s.atStory, 1)
  assert.equal(s.avgIndex, Math.round(((0 + 2 + 4) / 3) * 10) / 10)
  assert.equal(remedialSummary([]).total, 0)
})
