import { test } from "node:test"
import assert from "node:assert/strict"
import { describeAction, formatActionAt } from "@/lib/workflow/history"
import type { ActionRecord } from "@/lib/workflow"

function rec(over: Partial<ActionRecord> = {}): ActionRecord {
  return { stepId: "deliberate", actorRole: "DIRECTOR", actor: "R. Murugan", decision: "approve", at: "2026-06-10T05:30:00.000Z", ...over }
}

test("an approval reads as the role, named actor, and verb", () => {
  const d = describeAction(rec())
  assert.equal(d.mark, "✓")
  assert.equal(d.text, "DIRECTOR (R. Murugan) approved")
  assert.notEqual(d.when, "")
})

test("a rejection uses the ✗ mark and correct grammar (not 'rejectd')", () => {
  const d = describeAction(rec({ decision: "reject" }))
  assert.equal(d.mark, "✗")
  assert.match(d.text, /rejected/)
  assert.doesNotMatch(d.text, /rejectd/)
})

test("a resolve decision reads 'resolved'", () => {
  assert.match(describeAction(rec({ decision: "resolve" })).text, /resolved/)
})

test("a note is appended; an empty actor falls back to the role only", () => {
  assert.match(describeAction(rec({ note: "quorum met" })).text, /— quorum met$/)
  assert.equal(describeAction(rec({ actor: "" })).text, "DIRECTOR approved")
  assert.equal(describeAction(rec({ actor: "   " })).text, "DIRECTOR approved")
})

test("formatActionAt is empty for missing or invalid timestamps", () => {
  assert.equal(formatActionAt(undefined), "")
  assert.equal(formatActionAt(""), "")
  assert.equal(formatActionAt("not-a-date"), "")
  assert.notEqual(formatActionAt("2026-06-10T05:30:00.000Z"), "")
})
