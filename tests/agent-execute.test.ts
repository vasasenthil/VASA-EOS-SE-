import { test } from "node:test"
import assert from "node:assert/strict"
import { executeTool } from "@/lib/agents/execute"

test("initiate_dbt routes to the DBT bridge and returns an APBS reference", async () => {
  const r = await executeTool("welfare", "initiate_dbt", { apaar: "APAAR-1", amount: 6000 })
  assert.ok(r)
  assert.equal(r?.mode, "mock") // no INTEGRATION_DBT=live in tests
  assert.match(r?.output ?? "", /DBT settled — APBS/)
  assert.ok(r?.ref)
})

test("translate_content routes to the language service", async () => {
  const r = await executeTool("curriculum", "translate_content", { text: "hello", language: "ta" })
  assert.ok(r)
  assert.match(r?.output ?? "", /\[ta\] hello/)
})

test("send_ivr routes to TTS and reports a queued audio ref", async () => {
  const r = await executeTool("communication", "send_ivr", { numbers: "x", message: "Notice" })
  assert.match(r?.output ?? "", /IVR queued — audio/)
})

test("unrouted tools return null (dispatcher's handler stands in)", async () => {
  assert.equal(await executeTool("curriculum", "generate_lesson_plan", { topic: "Fractions", grade: 5 }), null)
})
