import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  SECRETARY_CAPABILITIES,
  capabilityById,
  byStatus,
  byDimension,
  secretaryCapabilitySummary,
  toCSV,
} from "@/lib/governance/secretary-capabilities"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("capabilities span all three dimensions and are well-formed", () => {
  for (const dim of ["general", "technical", "functional"] as const) {
    assert.ok(byDimension(dim).length >= 1, `no ${dim} capabilities`)
  }
  const ids = new Set<string>()
  for (const c of SECRETARY_CAPABILITIES) {
    assert.ok(!ids.has(c.id), `duplicate ${c.id}`)
    ids.add(c.id)
    assert.ok(c.responsibility)
    assert.ok(["built", "partial", "pending"].includes(c.status))
    assert.ok(["general", "technical", "functional"].includes(c.dimension))
  }
})

test("built/partial capabilities reference a real feature on disk (self-verifying)", () => {
  for (const c of SECRETARY_CAPABILITIES) {
    if (c.status === "pending") continue
    assert.notEqual(c.featureRef, "", `${c.id} → built/partial must name a feature`)
    assert.ok(existsSync(join(repoRoot, c.featureRef)), `${c.id} → missing feature ${c.featureRef}`)
  }
})

test("pending capabilities honestly claim NO feature (register cannot fake coverage)", () => {
  for (const c of byStatus("pending")) {
    assert.equal(c.featureRef, "", `${c.id} is pending but claims a feature`)
    assert.equal(c.route, "", `${c.id} is pending but claims a route`)
  }
  // The honest answer: every dedicated Secretary feature is now built, but the register still
  // does not overclaim — capabilities whose Secretary-tier depth is pending remain 'partial'.
  assert.ok(byStatus("partial").length + byStatus("pending").length >= 1, "register must still disclose what isn't fully built")
})

test("the two traced Secretary user stories are built", () => {
  assert.equal(capabilityById("approvals-oversight")?.status, "built") // US-SEC-1
  assert.equal(capabilityById("nep-analytics")?.status, "built") // US-SEC-2
})

test("summary tallies status and dimension counts honestly", () => {
  const s = secretaryCapabilitySummary()
  assert.equal(s.capabilities, SECRETARY_CAPABILITIES.length)
  assert.equal(s.built + s.partial + s.pending, s.capabilities)
  assert.equal(s.general + s.technical + s.functional, s.capabilities)
  assert.ok(s.builtPct > 0 && s.builtPct < 100, "honest: neither zero nor fully complete")
})

test("CSV has a header plus one row per capability", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Dimension,Responsibility,Feature,Route,Status")
  assert.equal(lines.length, SECRETARY_CAPABILITIES.length + 1)
})
