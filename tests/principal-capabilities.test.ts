import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  PRINCIPAL_CAPABILITIES,
  capabilityById,
  byStatus,
  byDimension,
  principalCapabilitySummary,
  toCSV,
} from "@/lib/governance/principal-capabilities"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("capabilities span all three dimensions and are well-formed", () => {
  for (const dim of ["general", "technical", "functional"] as const) {
    assert.ok(byDimension(dim).length >= 1, `no ${dim} capabilities`)
  }
  const ids = new Set<string>()
  for (const c of PRINCIPAL_CAPABILITIES) {
    assert.ok(!ids.has(c.id), `duplicate ${c.id}`)
    ids.add(c.id)
    assert.ok(c.responsibility)
    assert.ok(["built", "partial", "pending"].includes(c.status))
  }
})

test("status and feature are kept consistent (register cannot fake coverage)", () => {
  for (const c of PRINCIPAL_CAPABILITIES) {
    if (c.status === "pending") {
      assert.equal(c.featureRef, "", `${c.id} is pending but claims a feature`)
      assert.equal(c.route, "", `${c.id} is pending but claims a route`)
    } else {
      assert.notEqual(c.featureRef, "", `${c.id} names no feature`)
      assert.ok(existsSync(join(repoRoot, c.featureRef)), `${c.id} → missing feature ${c.featureRef}`)
      assert.notEqual(c.route, "")
    }
  }
})

test("the register honestly discloses a school self-assessment gap", () => {
  assert.equal(capabilityById("school-self-assessment")?.status, "pending")
  assert.ok(byStatus("pending").length >= 1)
})

test("summary tallies status and dimensions honestly", () => {
  const s = principalCapabilitySummary()
  assert.equal(s.capabilities, PRINCIPAL_CAPABILITIES.length)
  assert.equal(s.built + s.partial + s.pending, s.capabilities)
  assert.equal(s.general + s.technical + s.functional, s.capabilities)
  assert.equal(s.builtPct, Math.round((s.built / s.capabilities) * 100))
  assert.ok(s.builtPct > 0 && s.builtPct < 100)
})

test("CSV has the shared header plus one row per capability", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Dimension,Responsibility,Feature,Route,Status")
  assert.equal(lines.length, PRINCIPAL_CAPABILITIES.length + 1)
})
