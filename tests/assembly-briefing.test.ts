import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { stateRollup } from "@/lib/portal-data"
import {
  ASSEMBLY_QUESTIONS,
  formatValue,
  answerFor,
  briefingPack,
  questionById,
  byStatus,
  briefingSummary,
  toCSV,
} from "@/lib/governance/assembly-briefing"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("questions are well-formed with both starred and unstarred and a valid status", () => {
  const ids = new Set<string>()
  for (const q of ASSEMBLY_QUESTIONS) {
    assert.ok(!ids.has(q.id), `duplicate ${q.id}`)
    ids.add(q.id)
    assert.ok(q.number && q.member && q.questionText && q.subject)
    assert.ok(["starred", "unstarred"].includes(q.type))
    assert.ok(["draft", "reviewed", "cleared"].includes(q.status))
    assert.ok(q.supplementaries.length >= 1, `${q.id} should anticipate supplementaries`)
    assert.ok(q.answerTemplate.includes("{value}"), `${q.id} answer must interpolate live data`)
  }
  assert.ok(byStatus("cleared").length >= 1 && byStatus("draft").length >= 1)
})

test("every question's sourceRef points at a real module (self-verifying)", () => {
  for (const q of ASSEMBLY_QUESTIONS) {
    assert.ok(existsSync(join(repoRoot, q.sourceRef)), `${q.id} → missing source ${q.sourceRef}`)
  }
})

test("answers are composed from the live rollup, never hand-typed", () => {
  const r = stateRollup()
  const enrol = questionById("enrolment")!
  // The composed answer must contain the actual live figure, formatted.
  assert.ok(answerFor(enrol, r).includes(r.students.toLocaleString("en-IN")))
  // No leftover placeholder anywhere in the pack.
  for (const e of briefingPack(r)) {
    assert.ok(!e.answer.includes("{value}"), `${e.id} left an unfilled placeholder`)
    assert.ok(e.answer.length > 0)
  }
})

test("formatValue renders counts, percents and indices correctly", () => {
  assert.equal(formatValue(95, "percent"), "95%")
  assert.equal(formatValue(72, "index"), "72")
  assert.equal(formatValue(1234567, "count"), (1234567).toLocaleString("en-IN"))
})

test("summary tallies type, status, readiness and distinct sources", () => {
  const s = briefingSummary()
  assert.equal(s.questions, ASSEMBLY_QUESTIONS.length)
  assert.equal(s.starred + s.unstarred, s.questions)
  assert.equal(s.cleared + s.reviewed + s.draft, s.questions)
  assert.equal(s.readinessPct, Math.round((s.cleared / s.questions) * 100))
  assert.ok(s.sourcesCited >= 1 && s.sourcesCited <= s.questions)
})

test("CSV has a header plus one row per question", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Number,Type,Member,Constituency,Subject,Question,Answer,Source,Status")
  assert.equal(lines.length, ASSEMBLY_QUESTIONS.length + 1)
})
