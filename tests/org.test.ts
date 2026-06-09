import { test } from "node:test"
import assert from "node:assert/strict"
import { ORG_UNITS, ORG_KIND_LABELS, getOrg, childrenOf, orgPath, orgSummary, type OrgKind } from "@/lib/org"

test("every parentId resolves to a real org unit", () => {
  for (const o of ORG_UNITS) {
    if (o.parentId) assert.ok(getOrg(o.parentId), `dangling parent: ${o.id} -> ${o.parentId}`)
  }
})

test("every org kind is represented", () => {
  const present = new Set(ORG_UNITS.map((o) => o.kind))
  for (const k of Object.keys(ORG_KIND_LABELS) as OrgKind[]) {
    assert.ok(present.has(k), `missing kind: ${k}`)
  }
})

test("there are 7 directorates", () => {
  assert.equal(ORG_UNITS.filter((o) => o.kind === "directorate").length, 7)
})

test("orgPath returns the full ministry→school chain", () => {
  const path = orgPath("ghss-egmore").map((o) => o.id)
  assert.equal(path[0], "min-she")
  assert.equal(path[path.length - 1], "ghss-egmore")
  assert.ok(path.includes("deo-chennai"))
})

test("childrenOf and summary are consistent", () => {
  assert.ok(childrenOf("secretariat").length >= 7) // the directorates
  const s = orgSummary()
  assert.equal(s.total, ORG_UNITS.length)
  assert.equal(
    Object.values(s.byKind).reduce((a, b) => a + b, 0),
    ORG_UNITS.length,
  )
})
