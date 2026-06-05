import { test } from "node:test"
import assert from "node:assert/strict"
import { glSummary, GL_DOMAINS, type Lecture } from "@/lib/guestlectures"

const l = (speaker: string, domain: string, audience: number): Lecture => ({
  id: `l-${Math.random()}`,
  speaker,
  topic: "t",
  org: "o",
  domain,
  date: "2026-06-05",
  audience,
  cls: "9-10",
})

test("domain catalogue is non-empty", () => {
  assert.ok(GL_DOMAINS.includes("Career guidance"))
})

test("summary counts distinct speakers, domains and total audience", () => {
  const s = glSummary([
    l("Dr A", "Career guidance", 60),
    l("Dr A", "Health & wellness", 40),
    l("Ms B", "STEM / innovation", 50),
  ])
  assert.equal(s.lectures, 3)
  assert.equal(s.speakers, 2)
  assert.equal(s.audienceTotal, 150)
  assert.equal(s.domains, 3)
})
