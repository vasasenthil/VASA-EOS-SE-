import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { stateRollup } from "@/lib/portal-data"
import {
  ANNOUNCEMENTS,
  composeBody,
  pressKit,
  announcementById,
  byStatus,
  commsSummary,
  toCSV,
} from "@/lib/governance/public-communication"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("announcements are well-formed across channels and statuses", () => {
  const ids = new Set<string>()
  for (const a of ANNOUNCEMENTS) {
    assert.ok(!ids.has(a.id), `duplicate ${a.id}`)
    ids.add(a.id)
    assert.ok(a.title && a.audience)
    assert.ok(["press", "web", "sms", "social"].includes(a.channel))
    assert.ok(["draft", "cleared", "published"].includes(a.status))
    assert.ok(a.bodyTemplate.includes("{value}"), `${a.id} must interpolate live data`)
  }
  assert.ok(byStatus("published").length >= 1 && byStatus("draft").length >= 1)
})

test("every announcement cites a real source module (self-verifying)", () => {
  for (const a of ANNOUNCEMENTS) {
    assert.ok(existsSync(join(repoRoot, a.sourceRef)), `${a.id} → missing source ${a.sourceRef}`)
  }
})

test("bodies are composed from the live rollup, never hand-typed", () => {
  const r = stateRollup()
  const enrol = announcementById("enrolment-bulletin")!
  assert.ok(composeBody(enrol, r).includes(r.students.toLocaleString("en-IN")))
  for (const a of pressKit(r)) {
    assert.ok(!a.body.includes("{value}"), `${a.id} left an unfilled placeholder`)
  }
})

test("summary tallies status, channels and sources", () => {
  const s = commsSummary()
  assert.equal(s.announcements, ANNOUNCEMENTS.length)
  assert.equal(s.published + s.cleared + s.draft, s.announcements)
  assert.ok(s.channels >= 1 && s.sourcesCited >= 1)
})

test("CSV has a header plus one row per announcement", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "ID,Title,Channel,Audience,Body,Source,Status")
  assert.equal(lines.length, ANNOUNCEMENTS.length + 1)
})
