import { test } from "node:test"
import assert from "node:assert/strict"
import { decadeOf, alumniSummary, type Alumnus } from "@/lib/alumni"

test("decadeOf floors the year to its decade", () => {
  assert.equal(decadeOf(2014), "2010s")
  assert.equal(decadeOf(2019), "2010s")
  assert.equal(decadeOf(2020), "2020s")
  assert.equal(decadeOf(2008), "2000s")
})

test("summary groups by decade and finds the latest batch", () => {
  const list: Alumnus[] = [
    { id: "1", name: "A", batchYear: 2008, occupation: "", contact: "" },
    { id: "2", name: "B", batchYear: 2015, occupation: "", contact: "" },
    { id: "3", name: "C", batchYear: 2019, occupation: "", contact: "" },
  ]
  const s = alumniSummary(list)
  assert.equal(s.total, 3)
  assert.equal(s.byDecade["2010s"], 2)
  assert.equal(s.byDecade["2000s"], 1)
  assert.equal(s.latestBatch, 2019)
})
