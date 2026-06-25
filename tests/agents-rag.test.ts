import { test } from "node:test"
import assert from "node:assert/strict"
import { mockRetrieval } from "@/lib/integrations/mock"
import { liveRetrieval } from "@/lib/integrations/live/retrieval"
import { composeGrounding, runGroundedAgent } from "@/lib/agents"
import { integrationStatuses } from "@/lib/integrations/status"

test("mock retrieval ranks the corpus by keyword overlap", async () => {
  const r = await mockRetrieval.retrieve("foundational literacy and numeracy", { topK: 2 })
  assert.equal(r.ok, true)
  assert.equal(r.mode, "mock")
  assert.ok((r.data?.length ?? 0) >= 1)
  assert.equal(r.data?.[0].id, "nep-fln")
  assert.ok((r.data?.[0].score ?? 0) > 0)
})

test("mock retrieval returns nothing for an unrelated query", async () => {
  const r = await mockRetrieval.retrieve("xyzzy quantum teleportation")
  assert.deepEqual(r.data, [])
})

test("live retrieval fails closed when unconfigured (never throws)", async () => {
  const r = await liveRetrieval.retrieve("anything")
  assert.equal(r.ok, false)
  assert.equal(r.mode, "live")
  assert.match(r.error ?? "", /not configured/)
})

test("composeGrounding builds a cited context with distinct sources", () => {
  const g = composeGrounding([
    { id: "a", text: "Alpha fact.", source: "Src One", score: 0.9 },
    { id: "b", text: "Beta fact.", source: "Src One", score: 0.5 },
    { id: "c", text: "Gamma fact.", source: "Src Two", score: 0.4 },
  ])
  assert.match(g.context, /\[1\] Alpha fact\. \(Src One\)/)
  assert.match(g.context, /\[3\] Gamma fact\./)
  assert.deepEqual(g.sources, ["Src One", "Src Two"]) // distinct, citation order
})

test("runGroundedAgent grounds the agent and reports sources (mock path)", async () => {
  const r = await runGroundedAgent("curriculum", "Explain NIPUN foundational literacy")
  assert.equal(r.agent, "curriculum")
  assert.equal(r.grounded, true)
  assert.ok(r.sources.length >= 1)
  assert.equal(r.mode, "mock")
})

test("status surfaces the retrieval (RAG) port", () => {
  assert.ok(integrationStatuses().some((p) => p.key === "retrieval"))
})
