import { test } from "node:test"
import assert from "node:assert/strict"
import { humanizeSegment, breadcrumbsFor, routeTitle } from "@/lib/navigation"

test("humanizeSegment title-cases words and uppercases acronyms", () => {
  assert.equal(humanizeSegment("school-registry"), "School Registry")
  assert.equal(humanizeSegment("sis"), "SIS")
  assert.equal(humanizeSegment("ai-agents"), "AI Agents")
  assert.equal(humanizeSegment("123"), "123")
})

test("breadcrumbsFor builds a cumulative trail", () => {
  const crumbs = breadcrumbsFor("/governance/roles")
  assert.deepEqual(
    crumbs.map((c) => [c.label, c.href]),
    [
      ["Governance", "/governance"],
      ["Roles", "/governance/roles"],
    ],
  )
})

test("breadcrumbsFor prefers known titles from the map", () => {
  const crumbs = breadcrumbsFor("/school-registry", { "/school-registry": "School Registry (UDISE+)" })
  assert.equal(crumbs[0].label, "School Registry (UDISE+)")
})

test("breadcrumbsFor returns empty for root", () => {
  assert.deepEqual(breadcrumbsFor("/"), [])
})

test("routeTitle uses the map, then humanizes, then falls back to Home", () => {
  assert.equal(routeTitle("/health", { "/health": "System Self-Test" }), "System Self-Test")
  assert.equal(routeTitle("/adaptive-learning"), "Adaptive Learning")
  assert.equal(routeTitle("/"), "Home")
})
