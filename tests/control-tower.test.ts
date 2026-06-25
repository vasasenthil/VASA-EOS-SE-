import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  GOVERNANCE_BODIES,
  byKind,
  bodyById,
  byBodyStatus,
  controlTowerSummary,
  toControlTowerCSV,
} from "@/lib/governance/control-tower"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("the authority spine is complete: 3 Control-Tower bodies + 7 governance tiers (G1..G7)", () => {
  assert.equal(byKind("control-tower").length, 3)
  assert.equal(byKind("governance-tier").length, 7)
  assert.equal(GOVERNANCE_BODIES.length, 10)
  // the three named bodies
  for (const id of ["CT1", "CT2", "CT3"]) assert.equal(bodyById(id)?.kind, "control-tower")
  // G1..G7 present once each, in order
  assert.deepEqual(byKind("governance-tier").map((b) => b.id), ["G1", "G2", "G3", "G4", "G5", "G6", "G7"])
})

test("the named bodies match the brief (Sovereignty Console, Ethics Board, Leadership Council; CAG audit)", () => {
  assert.match(bodyById("CT1")!.name, /Sovereignty Console/)
  assert.match(bodyById("CT2")!.name, /Ethics Board/)
  assert.match(bodyById("CT3")!.name, /Leadership Council/)
  assert.match(bodyById("G7")!.name, /External Audit/)
})

test("built/partial bodies cite real on-disk instruments; pending cite nothing (no overstatement)", () => {
  for (const b of GOVERNANCE_BODIES) {
    if (b.status === "pending") {
      assert.equal(b.repoRefs.length, 0, `${b.id} is pending but cites instruments`)
    } else {
      assert.ok(b.repoRefs.length >= 1, `${b.id} claims ${b.status} but cites no instrument`)
      for (const ref of b.repoRefs) {
        assert.ok(existsSync(join(repoRoot, ref)), `${b.id} → missing instrument ${ref}`)
      }
    }
    assert.ok(b.mandate.length > 0 && b.authority.length > 0 && b.note.length > 0, `${b.id} lacks mandate/authority/note`)
  }
})

test("the out-of-scope sovereign substrate is disclosed as pending aspects of the Sovereignty Console", () => {
  const ct1 = bodyById("CT1")!
  assert.equal(ct1.status, "partial")
  const pending = ct1.pendingAspects.join(" ").toLowerCase()
  assert.ok(/key|hsm|escrow|off-switch/.test(pending), "CT1 must disclose the sovereign-substrate gaps")
  // External audit is honestly not claimed as done.
  assert.equal(bodyById("G7")!.status, "partial")
  assert.ok(bodyById("G7")!.pendingAspects.join(" ").toLowerCase().includes("audit"))
})

test("coverage is an honest weighted figure, not 100%, and partitions cleanly", () => {
  const s = controlTowerSummary()
  assert.equal(s.total, 10)
  assert.equal(s.controlTower, 3)
  assert.equal(s.governanceTiers, 7)
  assert.equal(s.built + s.partial + s.pending, s.total)
  assert.ok(s.coveragePct > 0 && s.coveragePct < 100, `coverage ${s.coveragePct}% should be a candid mid-range`)
  assert.equal(byBodyStatus("built").length + byBodyStatus("partial").length + byBodyStatus("pending").length, 10)
})

test("CSV export is formula-injection-safe and includes the header", () => {
  const csv = toControlTowerCSV()
  assert.match(csv.split("\n")[0], /Id,Kind,Name,Mandate,Authority,Status,Note,Instruments,Pending aspects/)
  assert.equal(csv.split("\n").length, GOVERNANCE_BODIES.length + 1)
})
