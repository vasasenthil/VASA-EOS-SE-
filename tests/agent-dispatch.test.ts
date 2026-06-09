import { test } from "node:test"
import assert from "node:assert/strict"
import { dispatchTool, validateToolArgs } from "@/lib/agents/dispatch"
import { toolByName } from "@/lib/agents/tools"

test("validateToolArgs flags missing required, unknown and mistyped args", () => {
  const tool = toolByName("welfare", "initiate_dbt")!
  assert.deepEqual(validateToolArgs(tool, { apaar: "APAAR-1", amount: 100 }), [])
  assert.ok(validateToolArgs(tool, { apaar: "APAAR-1" }).some((e) => /amount/.test(e))) // missing
  assert.ok(validateToolArgs(tool, { apaar: "APAAR-1", amount: 100, extra: "x" }).some((e) => /unknown/.test(e)))
  assert.ok(validateToolArgs(tool, { apaar: "APAAR-1", amount: "lots" }).some((e) => /must be number/.test(e)))
})

test("unknown tool for an agent is rejected", () => {
  const r = dispatchTool("curriculum", "initiate_dbt", {})
  assert.equal(r.ok, false)
  assert.ok(r.errors?.[0].includes("unknown tool"))
})

test("read-only tool executes immediately", () => {
  const r = dispatchTool("welfare", "check_eligibility", { apaar: "APAAR-1", scheme: "pudhumai" })
  assert.equal(r.ok, true)
  assert.equal(r.executed, true)
  assert.equal(r.requiresApproval, false)
  assert.match(r.output ?? "", /Eligibility/)
})

test("side-effecting tool is NOT executed without approval (HITL)", () => {
  const pending = dispatchTool("welfare", "initiate_dbt", { apaar: "APAAR-1", amount: 6000 })
  assert.equal(pending.ok, true)
  assert.equal(pending.executed, false)
  assert.equal(pending.requiresApproval, true)
})

test("side-effecting tool executes once approved", () => {
  const done = dispatchTool("welfare", "initiate_dbt", { apaar: "APAAR-1", amount: 6000 }, { approved: true })
  assert.equal(done.executed, true)
  assert.equal(done.requiresApproval, false)
})

test("invalid args block execution even when approved", () => {
  const r = dispatchTool("welfare", "initiate_dbt", { apaar: "APAAR-1" }, { approved: true })
  assert.equal(r.ok, false)
  assert.equal(r.executed, false)
})
