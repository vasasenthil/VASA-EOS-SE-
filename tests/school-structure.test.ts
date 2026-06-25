import { test } from "node:test"
import assert from "node:assert/strict"
import {
  SCHOOL_STAGES,
  SCHOOL_CATEGORIES,
  stageForGrade,
  stageForAge,
  categoryByCode,
  categoriesByManagement,
  structureSummary,
} from "@/lib/school-structure"

test("the four NEP stages cover grades 0–12 contiguously (5+3+3+4)", () => {
  assert.equal(SCHOOL_STAGES.length, 4)
  assert.deepEqual(SCHOOL_STAGES.map((s) => s.grades.length), [3, 3, 3, 4]) // 5+3+3+4 (foundational incl. pre-primary)
  const all = SCHOOL_STAGES.flatMap((s) => s.grades)
  assert.deepEqual([...new Set(all)].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
})

test("stageForGrade maps grades to the right stage", () => {
  assert.equal(stageForGrade(0)?.code, "foundational")
  assert.equal(stageForGrade(2)?.code, "foundational")
  assert.equal(stageForGrade(4)?.code, "preparatory")
  assert.equal(stageForGrade(7)?.code, "middle")
  assert.equal(stageForGrade(11)?.code, "secondary")
  assert.equal(stageForGrade(13), undefined)
})

test("stageForAge maps ages to the right stage; out-of-range is undefined", () => {
  assert.equal(stageForAge(4)?.code, "foundational")
  assert.equal(stageForAge(9)?.code, "preparatory")
  assert.equal(stageForAge(12)?.code, "middle")
  assert.equal(stageForAge(16)?.code, "secondary")
  assert.equal(stageForAge(20), undefined)
})

test("category registry covers the mind-map categories", () => {
  const names = SCHOOL_CATEGORIES.map((c) => c.name)
  for (const n of ["Government", "Local Body", "Government Aided", "Private Unaided", "Matriculation", "CBSE / ICSE / Other Boards", "Minority", "Central Govt Schools"]) {
    assert.ok(names.includes(n), `missing category: ${n}`)
  }
  assert.equal(categoryByCode("central")?.management, "central")
  assert.equal(categoryByCode("nope"), undefined)
  assert.ok(categoriesByManagement("private_unaided").length >= 2)
})

test("summary is coherent", () => {
  const s = structureSummary()
  assert.equal(s.stages, 4)
  assert.equal(s.totalGrades, 13)
  assert.equal(s.categories, SCHOOL_CATEGORIES.length)
  assert.ok(s.managements >= 4)
})
