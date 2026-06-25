import { test } from "node:test"
import assert from "node:assert/strict"
import { ECONTENT_LIBRARY, filterContent, econtentSummary } from "@/lib/econtent"

test("filter by type narrows results", () => {
  const videos = filterContent(ECONTENT_LIBRARY, { type: "Video" })
  assert.ok(videos.every((i) => i.type === "Video"))
})

test("filter by subject and query", () => {
  const maths = filterContent(ECONTENT_LIBRARY, { subject: "Mathematics" })
  assert.ok(maths.every((i) => i.subject === "Mathematics"))
  const q = filterContent(ECONTENT_LIBRARY, { q: "fractions" })
  assert.ok(q.length >= 1)
  assert.equal(filterContent(ECONTENT_LIBRARY, {}).length, ECONTENT_LIBRARY.length)
})

test("summary tallies by type and counts subjects", () => {
  const s = econtentSummary(ECONTENT_LIBRARY)
  assert.equal(s.total, ECONTENT_LIBRARY.length)
  assert.equal(s.byType.Video + s.byType.Document + s.byType.Interactive + s.byType.Audio, ECONTENT_LIBRARY.length)
  assert.ok(s.subjects >= 1)
})
