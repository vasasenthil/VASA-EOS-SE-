import { test } from "node:test"
import assert from "node:assert/strict"
import { classifyLicense, checkLicenses, licenseSummary } from "@/lib/security/license-policy"

test("permissive licenses are allowed", () => {
  for (const id of ["MIT", "ISC", "Apache-2.0", "BSD-3-Clause", "0BSD"]) {
    assert.equal(classifyLicense(id), "allowed", id)
  }
})

test("strong copyleft / non-OSS are denied", () => {
  for (const id of ["GPL-3.0", "AGPL-3.0", "SSPL-1.0", "BUSL-1.1"]) {
    assert.equal(classifyLicense(id), "denied", id)
  }
})

test("unknown, empty and weak-copyleft need review", () => {
  assert.equal(classifyLicense(undefined), "review")
  assert.equal(classifyLicense(""), "review")
  assert.equal(classifyLicense("LGPL-3.0"), "review")
  assert.equal(classifyLicense("MPL-2.0"), "review")
})

test("SPDX expression takes the most-restrictive term", () => {
  assert.equal(classifyLicense("(MIT OR Apache-2.0)"), "allowed") // both permissive
  assert.equal(classifyLicense("(MIT OR GPL-3.0)"), "denied") // a denied term present
})

test("checkLicenses returns the non-allowed worklist; summary gates on denied", () => {
  const items = [
    { name: "a", license: "MIT" },
    { name: "b", license: "GPL-3.0" },
    { name: "c", license: "LGPL-3.0" },
    { name: "d", license: undefined },
  ]
  const findings = checkLicenses(items)
  assert.equal(findings.length, 3) // b denied, c review, d review (a allowed excluded)
  const s = licenseSummary(items)
  assert.equal(s.allowed, 1)
  assert.equal(s.denied, 1)
  assert.equal(s.review, 2)
  assert.equal(s.passesGate, false)
  assert.equal(licenseSummary([{ name: "a", license: "MIT" }]).passesGate, true)
})
