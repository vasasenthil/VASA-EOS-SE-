import { test } from "node:test"
import assert from "node:assert/strict"
import type { Doc } from "@/lib/ai/engines/conversational"
import {
  TOOLS, listTools, getTool, describeTools, invokeTool, toolRegistrySummary,
  type ToolContext,
} from "@/lib/mcp"

const corpus: Doc[] = [
  { id: "d1", text: "Fractions represent parts of a whole and are taught after division and place value.", source: "TN Math Handbook, Grade 4" },
  { id: "d2", text: "The mid-day meal scheme provides a free nutritious lunch to every government school child.", source: "TN MDM GO" },
]
const ctx: ToolContext = { corpus }

test("the tool registry exposes typed MCP-style descriptors", () => {
  assert.ok(TOOLS.length >= 4)
  const desc = describeTools()
  assert.equal(desc.length, TOOLS.length)
  for (const d of desc) {
    assert.ok(d.name && d.description && d.params, `tool ${d.name} malformed`)
    // descriptors carry no handler (MCP discovery shape)
    assert.equal((d as unknown as Record<string, unknown>).run, undefined)
  }
  const s = toolRegistrySummary()
  assert.equal(s.total, TOOLS.length)
  assert.equal(s.retrieval + s.curriculumGraph, s.total)
})

test("curriculum.retrieve grounds an answer in the corpus and cites it", () => {
  const r = invokeTool("curriculum.retrieve", { query: "what are fractions?" }, ctx)
  assert.equal(r.ok, true)
  assert.equal(r.grounded, true)
  assert.ok(r.citations.length >= 1)
  assert.equal(r.citations[0].source, "TN Math Handbook, Grade 4")
  assert.match(r.summary, /Fractions/)
  assert.equal(r.humanAuthority, true)
})

test("curriculum.retrieve refuses (ungrounded) when nothing matches — no invention", () => {
  const r = invokeTool("curriculum.retrieve", { query: "quantum chromodynamics" }, ctx)
  assert.equal(r.grounded, false)
  assert.equal(r.citations.length, 0)
})

test("concept tools resolve by id or name and cite the curriculum graph", () => {
  const byId = invokeTool("concept.lookup", { concept: "frac" }, ctx)
  assert.equal(byId.ok, true)
  assert.match(byId.summary, /Fractions/)
  assert.equal(byId.citations[0].source, "TN Curriculum Knowledge Graph")

  const prereq = invokeTool("concept.prerequisites", { concept: "Fractions" }, ctx) // by name
  assert.equal(prereq.ok, true)
  assert.ok(Array.isArray((prereq.data as { prerequisites: unknown[] }).prerequisites))
  assert.match(prereq.summary, /requires/)

  const path = invokeTool("learning.path", { concept: "frac" }, ctx)
  assert.equal(path.ok, true)
  assert.match(path.summary, /Path to Fractions/)
})

test("invoke fails closed on unknown tool and missing required params (never throws)", () => {
  const unknown = invokeTool("does.not.exist", {}, ctx)
  assert.equal(unknown.ok, false)
  assert.equal(unknown.reason, "unknown-tool")

  const missing = invokeTool("curriculum.retrieve", {}, ctx)
  assert.equal(missing.ok, false)
  assert.equal(missing.reason, "missing-param")

  const badConcept = invokeTool("concept.lookup", { concept: "nonexistent" }, ctx)
  assert.equal(badConcept.ok, false)
  assert.equal(badConcept.reason, "not-found")
})

test("getTool / listTools are consistent", () => {
  assert.equal(listTools().length, TOOLS.length)
  assert.equal(getTool("learning.path")?.name, "learning.path")
  assert.equal(getTool("nope"), undefined)
})
