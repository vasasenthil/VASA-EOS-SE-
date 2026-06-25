import { test } from "node:test"
import assert from "node:assert/strict"
import { reconcileSchool, verifyFromResult, verificationLabel } from "@/lib/integrations/reconcile"
import { integrations } from "@/lib/integrations"
import type { SchoolRecord } from "@/lib/integrations/types"

const REGISTRY: SchoolRecord = {
  udiseCode: "33010100101",
  name: "Government Higher Secondary School, Egmore",
  district: "Chennai",
  block: "Egmore",
  managementType: "Government",
  board: "State (TN SCERT)",
}

test("a fully-matching local record verifies (case/space-insensitive)", () => {
  const local: SchoolRecord = {
    udiseCode: "33010100101",
    name: "  government higher secondary school, egmore ",
    district: "CHENNAI",
    block: "Egmore",
    managementType: "government",
    board: "State (TN SCERT)",
  }
  const v = reconcileSchool(local, REGISTRY)
  assert.equal(v.status, "verified")
  assert.equal(v.mismatches.length, 0)
  assert.equal(v.checked, 5)
})

test("a differing field is reported as a precise mismatch", () => {
  const local: SchoolRecord = { ...REGISTRY, district: "Tiruvallur", board: "CBSE" }
  const v = reconcileSchool(local, REGISTRY)
  assert.equal(v.status, "mismatch")
  assert.equal(v.mismatches.length, 2)
  const fields = v.mismatches.map((m) => m.field).sort()
  assert.deepEqual(fields, ["board", "district"])
  const district = v.mismatches.find((m) => m.field === "district")!
  assert.equal(district.local, "Tiruvallur")
  assert.equal(district.registry, "Chennai")
})

test("the registry is the source of truth — empty local fields are not mismatches", () => {
  // the platform only knows the code + name; it asserts nothing about block/management → only 2 checked.
  const local: SchoolRecord = { udiseCode: "33010100101", name: "Government Higher Secondary School, Egmore", district: "Chennai" }
  const v = reconcileSchool(local, REGISTRY)
  assert.equal(v.status, "verified")
  assert.equal(v.checked, 2)
})

test("a missing registry record is not_found (failed/empty lookup)", () => {
  assert.equal(reconcileSchool({ udiseCode: "X", name: "X" }, null).status, "not_found")
  assert.equal(reconcileSchool({ udiseCode: "X", name: "X" }, undefined).status, "not_found")
  assert.equal(reconcileSchool({ udiseCode: "X", name: "X" }, { udiseCode: "", name: "" }).status, "not_found")
})

test("verifyFromResult carries the trace id and treats a failed lookup as not_found", () => {
  const ok = verifyFromResult({ udiseCode: "33010100101", name: "Government Higher Secondary School, Egmore" }, {
    ok: true,
    data: REGISTRY,
    mode: "mock",
    traceId: "trace-123",
  })
  assert.equal(ok.status, "verified")
  assert.equal(ok.traceId, "trace-123")
  const bad = verifyFromResult({ udiseCode: "Z", name: "Z" }, { ok: false, error: "timeout", mode: "live", traceId: "t-9" })
  assert.equal(bad.status, "not_found")
  assert.equal(bad.traceId, "t-9")
})

test("end-to-end through the configured port (mock by default) — the gate runs against real adapter output", async () => {
  const res = await integrations.udise.getSchool("33010100101")
  assert.equal(res.ok, true)
  // the mock returns a deterministic record; reconciling its OWN output against itself must verify.
  const v = verifyFromResult(res.data!, res)
  assert.equal(v.status, "verified")
  // and a deliberately wrong local record against the same port output is a mismatch.
  const wrong = verifyFromResult({ ...res.data!, name: "Some Other School" }, res)
  assert.equal(wrong.status, "mismatch")
})

test("verificationLabel renders each status", () => {
  assert.match(verificationLabel("verified"), /Verified/)
  assert.match(verificationLabel("mismatch"), /Mismatch/)
  assert.match(verificationLabel("not_found"), /Not found/)
})
