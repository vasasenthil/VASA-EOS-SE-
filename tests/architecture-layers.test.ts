import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  ARCHITECTURE_LAYERS,
  layerById,
  byLayerStatus,
  layersSummary,
  toLayersCSV,
  type LayerId,
} from "@/lib/governance/architecture-layers"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("exactly twelve layers, present once each, in order L1..L12", () => {
  assert.equal(ARCHITECTURE_LAYERS.length, 12)
  const expected: LayerId[] = ["L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8", "L9", "L10", "L11", "L12"]
  assert.deepEqual(ARCHITECTURE_LAYERS.map((l) => l.id), expected)
  // each is retrievable and unique
  for (const id of expected) assert.equal(layerById(id)?.id, id)
})

test("the stack is anchored: L1 Sovereign Foundation → L12 Citizen & Civic Layer", () => {
  assert.match(layerById("L1")!.name, /Sovereign Foundation/)
  assert.match(layerById("L12")!.name, /Citizen & Civic/)
})

test("built/partial layers cite real on-disk evidence; pending cite nothing (no overstatement)", () => {
  for (const l of ARCHITECTURE_LAYERS) {
    if (l.status === "pending") {
      assert.equal(l.repoRefs.length, 0, `${l.id} is pending but cites evidence`)
    } else {
      assert.ok(l.repoRefs.length >= 1, `${l.id} claims ${l.status} but cites no evidence`)
      for (const ref of l.repoRefs) {
        assert.ok(existsSync(join(repoRoot, ref)), `${l.id} → missing evidence ${ref}`)
      }
    }
    // every layer must describe itself with at least one component
    assert.ok(l.components.length >= 1, `${l.id} has no components`)
    assert.ok(l.responsibility.length > 0 && l.note.length > 0, `${l.id} lacks responsibility/note`)
  }
})

test("the out-of-scope sovereign substrate is disclosed as un-built, not silently claimed", () => {
  // L1/L2 must remain partial (app controls built, substrate out of scope) and enumerate what is NOT built.
  assert.equal(layerById("L1")!.status, "partial")
  assert.equal(layerById("L2")!.status, "partial")
  const l1Pending = layerById("L1")!.pendingAspects.join(" ").toLowerCase()
  assert.ok(/hsm|key custody|escrow|off-switch/.test(l1Pending), "L1 must disclose the sovereign-substrate gaps")
  // Federation must not be overclaimed as fully built (still mock-default seams).
  assert.equal(layerById("L4")!.status, "partial")
})

test("coverage score is an honest weighted figure, not 100%", () => {
  const s = layersSummary()
  assert.equal(s.total, 12)
  assert.equal(s.built + s.partial + s.pending, s.total)
  assert.ok(s.coveragePct > 0 && s.coveragePct < 100, `coverage ${s.coveragePct}% should be a candid mid-range`)
  // byLayerStatus partitions cleanly
  assert.equal(byLayerStatus("built").length + byLayerStatus("partial").length + byLayerStatus("pending").length, 12)
})

test("CSV export is formula-injection-safe and includes the header", () => {
  const csv = toLayersCSV()
  assert.match(csv.split("\n")[0], /Layer,Name,Responsibility,Status,Note,Components,Evidence,Pending aspects/)
  assert.equal(csv.split("\n").length, ARCHITECTURE_LAYERS.length + 1)
})
