import { test } from "node:test"
import assert from "node:assert/strict"
import {
  emptyForumResolution,
  validateForumResolution,
  completenessPct,
  requiresMinister,
  MINISTER_RATIFICATION_THRESHOLD,
  type ForumResolutionForm,
} from "@/lib/governance/forum-resolution"

function valid(): ForumResolutionForm {
  return {
    forum: "State Steering Committee",
    category: "Budget & finance",
    title: "Q1 FY26 budget reallocation",
    meetingDate: "2026-06-15",
    decisionText: "Resolved to reallocate the PM POSHAN underspend to the CMBS vendor expansion for the next quarter.",
    responsible: "Joint Director (Finance)",
    accountable: "Director of School Education",
    fundImplication: 5_000_000,
    significant: false,
    actionItems: ["Issue revised sanction order"],
    declaration: true,
  }
}

test("an empty resolution fails with field errors", () => {
  const { ok, errors } = validateForumResolution(emptyForumResolution())
  assert.equal(ok, false)
  assert.ok(errors.forum && errors.category && errors.title && errors.meetingDate && errors.decisionText && errors.responsible && errors.accountable && errors.declaration)
})

test("a complete, valid resolution passes", () => {
  const { ok, errors } = validateForumResolution(valid())
  assert.equal(ok, true, JSON.stringify(errors))
})

test("invalid forum/category and a short decision text are rejected", () => {
  assert.ok(validateForumResolution({ ...valid(), forum: "Made-up Forum" }).errors.forum)
  assert.ok(validateForumResolution({ ...valid(), category: "nonsense" }).errors.category)
  assert.ok(validateForumResolution({ ...valid(), decisionText: "too short" }).errors.decisionText)
  assert.match(validateForumResolution({ ...valid(), meetingDate: "bad" }).errors.meetingDate ?? "", /valid date/)
  assert.ok(validateForumResolution({ ...valid(), fundImplication: -1 }).errors.fundImplication)
})

test("Minister ratification escalates on significance OR the fund threshold", () => {
  assert.equal(requiresMinister(valid()), false)
  assert.equal(requiresMinister({ ...valid(), significant: true }), true)
  assert.equal(requiresMinister({ ...valid(), fundImplication: MINISTER_RATIFICATION_THRESHOLD }), true)
  assert.equal(requiresMinister({ ...valid(), fundImplication: MINISTER_RATIFICATION_THRESHOLD - 1 }), false)
})

test("completeness rises from low to 100", () => {
  assert.ok(completenessPct(emptyForumResolution()) < 20)
  assert.equal(completenessPct(valid()), 100)
})
