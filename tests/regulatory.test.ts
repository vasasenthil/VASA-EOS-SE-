import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  REG_FRAMEWORKS,
  frameworkById,
  byStatus,
  regSummary,
  toCSV,
} from "@/lib/compliance/regulatory"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("the 'All Approvals Aligned' roster includes the named frameworks", () => {
  const ids = REG_FRAMEWORKS.map((f) => f.id)
  for (const required of [
    "nep-2020", "tn-sep", "ndear-s", "netf", "dpdp-2023",
    "rpwd-2016", "rte-2009", "pocso-2012", "iso-27001", "wcag-22-aaa", "un-sdg-4",
  ]) {
    assert.ok(ids.includes(required), `missing framework ${required}`)
  }
  assert.ok(REG_FRAMEWORKS.length >= 11)
})

test("every framework's controlRef points at a real file (self-verifying)", () => {
  for (const f of REG_FRAMEWORKS) {
    assert.ok(existsSync(join(repoRoot, f.controlRef)), `${f.id} → missing control ${f.controlRef}`)
  }
})

test("frameworks needing external attestation are honestly 'partial' with a step", () => {
  for (const id of ["iso-27001", "wcag-22-aaa", "dpdp-2023", "ndear-s"]) {
    const f = frameworkById(id)
    assert.equal(f?.status, "partial")
    assert.ok(f?.externalStep && f.externalStep.length > 0, `${id} must state the external step`)
  }
  // in-code frameworks are aligned
  assert.equal(frameworkById("rpwd-2016")?.status, "aligned")
  assert.equal(frameworkById("rte-2009")?.status, "aligned")
})

test("aligned frameworks never claim an external step", () => {
  for (const f of byStatus("aligned")) assert.equal(f.externalStep, undefined)
})

test("summary tallies aligned vs partial and distinct authorities", () => {
  const s = regSummary()
  assert.equal(s.frameworks, REG_FRAMEWORKS.length)
  assert.equal(s.aligned + s.partial, s.frameworks)
  assert.ok(s.aligned >= 1 && s.partial >= 1 && s.authorities > 1)
})

test("CSV has a header plus one row per framework", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Framework,Authority,Scope,Component,Status,External step")
  assert.equal(lines.length, REG_FRAMEWORKS.length + 1)
})
