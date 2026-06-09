import { test } from "node:test"
import assert from "node:assert/strict"
import { CHANNELS, AUDIENCES, audienceSize, validateMessage, MAX_LEN } from "@/lib/comms"
import { SIS_ROSTER } from "@/lib/sis"

test("channels and audiences are defined", () => {
  assert.equal(CHANNELS.length, 4)
  assert.equal(AUDIENCES.length, 4)
})

test("audience sizing reflects the roster", () => {
  assert.equal(audienceSize("all_parents"), SIS_ROSTER.length)
  assert.equal(audienceSize("single"), 1)
  assert.ok(audienceSize("class") >= 1 && audienceSize("class") <= SIS_ROSTER.length)
})

test("validateMessage rejects empty and over-long bodies", () => {
  assert.match(validateMessage("") ?? "", /empty/i)
  assert.match(validateMessage("   ") ?? "", /empty/i)
  assert.match(validateMessage("a".repeat(MAX_LEN + 1)) ?? "", /too long/i)
  assert.equal(validateMessage("Parents meeting on Friday."), null)
})
