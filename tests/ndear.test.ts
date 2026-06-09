import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { NDEAR_REGISTER, ndearById, byKind, ndearSummary, toCSV } from "@/lib/compliance/ndear"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("register is well-formed and covers both principles and building blocks", () => {
  const ids = new Set<string>()
  for (const n of NDEAR_REGISTER) {
    assert.ok(!ids.has(n.id), `duplicate ${n.id}`)
    ids.add(n.id)
    assert.ok(["principle", "building-block"].includes(n.kind))
    assert.ok(["implemented", "partial", "infra-pending"].includes(n.status))
    assert.ok(n.name && n.requirement)
  }
  assert.ok(byKind("principle").length >= 1)
  assert.ok(byKind("building-block").length >= 1)
})

test("every componentRef points at a real file in the repo (self-verifying)", () => {
  for (const n of NDEAR_REGISTER) {
    assert.ok(existsSync(join(repoRoot, n.componentRef)), `${n.id} → missing component ${n.componentRef}`)
  }
})

test("core building blocks are present and mapped", () => {
  for (const id of ["bb-identity", "bb-registries", "bb-content", "bb-consent", "bb-payments", "bb-audit"]) {
    assert.ok(ndearById(id), `missing building block ${id}`)
  }
  assert.equal(ndearById("bb-consent")?.status, "implemented")
})

test("summary tallies kinds, statuses and coverage percentage", () => {
  const s = ndearSummary()
  assert.equal(s.total, NDEAR_REGISTER.length)
  assert.equal(s.principles + s.buildingBlocks, s.total)
  assert.equal(s.implemented + s.partial + s.infraPending, s.total)
  assert.ok(s.coveragePct > 0 && s.coveragePct <= 100)
})

test("CSV has a header plus one row per item", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "ID,Kind,Name,NDEAR requirement,Component,Status")
  assert.equal(lines.length, NDEAR_REGISTER.length + 1)
})
