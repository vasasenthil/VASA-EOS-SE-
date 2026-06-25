import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  RTE_ENTITLEMENTS,
  entitlementById,
  byStatus,
  rteEntitlementSummary,
  toCSV,
} from "@/lib/compliance/rte-entitlements"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("the core RTE entitlements are all present", () => {
  const ids = RTE_ENTITLEMENTS.map((e) => e.id)
  for (const required of ["free-compulsory", "ews-quota", "no-screening", "no-detention", "no-expulsion", "infrastructure-norms", "ptr-qualified-teachers", "smc-parents", "neighbourhood-access", "tc-on-demand", "tamper-evident"]) {
    assert.ok(ids.includes(required), `missing entitlement ${required}`)
  }
  for (const e of RTE_ENTITLEMENTS) {
    assert.ok(e.entitlement && e.mechanism && e.section)
    assert.ok(["enforced", "partial"].includes(e.status))
  }
})

test("every entitlement's controlRef points at a real file (self-verifying)", () => {
  for (const e of RTE_ENTITLEMENTS) {
    assert.ok(existsSync(join(repoRoot, e.controlRef)), `${e.id} → missing control ${e.controlRef}`)
  }
})

test("the 25% quota and tamper-evident ledger are enforced today; roster/census-bound entitlements are partial", () => {
  assert.equal(entitlementById("ews-quota")?.status, "enforced")
  assert.equal(entitlementById("ews-quota")?.controlRef, "lib/rte/index.ts")
  assert.equal(entitlementById("tamper-evident")?.controlRef, "lib/audit/trail.ts")
  assert.equal(entitlementById("ptr-qualified-teachers")?.status, "partial") // real sanctioned rosters at deploy
  assert.equal(entitlementById("neighbourhood-access")?.status, "partial") // real OOSC census at deploy
})

test("summary tallies entitlements and the distinct RTE sections enforced", () => {
  const s = rteEntitlementSummary()
  assert.equal(s.entitlements, RTE_ENTITLEMENTS.length)
  assert.equal(s.enforced + s.partial, s.entitlements)
  assert.ok(s.sectionsCovered >= 1 && s.sectionsCovered <= s.entitlements)
  assert.ok(byStatus("enforced").length >= 1)
})

test("CSV has a header plus one row per entitlement", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Entitlement,Section,Mechanism,Component,Status")
  assert.equal(lines.length, RTE_ENTITLEMENTS.length + 1)
})
