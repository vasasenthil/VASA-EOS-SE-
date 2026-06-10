import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  MINISTER_CAPABILITIES,
  capabilityById,
  byStatus,
  byDimension,
  ministerCapabilitySummary,
  toCSV,
} from "@/lib/governance/minister-capabilities"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("capabilities span all three dimensions and are well-formed", () => {
  for (const dim of ["general", "technical", "functional"] as const) {
    assert.ok(byDimension(dim).length >= 1, `no ${dim} capabilities`)
  }
  const ids = new Set<string>()
  for (const c of MINISTER_CAPABILITIES) {
    assert.ok(!ids.has(c.id), `duplicate ${c.id}`)
    ids.add(c.id)
    assert.ok(c.responsibility)
    assert.ok(["built", "partial", "pending"].includes(c.status))
    assert.ok(["general", "technical", "functional"].includes(c.dimension))
  }
})

test("status and feature are kept consistent (register cannot fake coverage)", () => {
  for (const c of MINISTER_CAPABILITIES) {
    if (c.status === "pending") {
      assert.equal(c.featureRef, "", `${c.id} is pending but claims a feature`)
      assert.equal(c.route, "", `${c.id} is pending but claims a route`)
    } else {
      assert.notEqual(c.featureRef, "", `${c.id} is ${c.status} but names no feature`)
      assert.ok(existsSync(join(repoRoot, c.featureRef)), `${c.id} → missing feature ${c.featureRef}`)
      assert.notEqual(c.route, "", `${c.id} is ${c.status} but names no route`)
    }
  }
})

test("the register stays honest — every dedicated feature built, partials not overclaimed", () => {
  // Pending features have been built out; the register still does not overclaim because the
  // executive-depth capabilities remain 'partial' rather than 'built'.
  assert.equal(capabilityById("scheme-launch")?.status, "built")
  assert.equal(capabilityById("public-communication")?.status, "built")
  assert.ok(byStatus("partial").length >= 1, "depth-limited capabilities stay partial")
})

test("the Minister reuses cross-role features built for the office", () => {
  // The Assembly briefing pack and cabinet-note tool are Minister-facing.
  assert.equal(capabilityById("assembly-answers")?.featureRef, "lib/governance/assembly-briefing.ts")
  assert.equal(capabilityById("cabinet-authority")?.featureRef, "lib/governance/cabinet-note.ts")
})

test("summary tallies status and dimension counts honestly", () => {
  const s = ministerCapabilitySummary()
  assert.equal(s.capabilities, MINISTER_CAPABILITIES.length)
  assert.equal(s.built + s.partial + s.pending, s.capabilities)
  assert.equal(s.general + s.technical + s.functional, s.capabilities)
  assert.equal(s.builtPct, Math.round((s.built / s.capabilities) * 100))
  assert.ok(s.builtPct > 0 && s.builtPct < 100, "honest: neither zero nor fully complete")
})

test("CSV has a header plus one row per capability", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Dimension,Responsibility,Feature,Route,Status")
  assert.equal(lines.length, MINISTER_CAPABILITIES.length + 1)
})
