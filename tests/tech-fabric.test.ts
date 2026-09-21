import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  FABRIC_ELEMENTS,
  elementById,
  byFabricStatus,
  fabricSummary,
  toFabricCSV,
} from "@/lib/governance/tech-fabric"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("all eight advanced-tech-fabric elements are present, once each", () => {
  assert.equal(FABRIC_ELEMENTS.length, 8)
  const ids = ["ML", "DL", "IOT", "CHAIN", "NFT", "DAO", "EDGE", "RAGMCP"]
  assert.deepEqual(FABRIC_ELEMENTS.map((e) => e.id).sort(), [...ids].sort())
  for (const id of ids) assert.equal(elementById(id)?.id, id)
})

test("built/partial elements cite real on-disk evidence; pending cite nothing (no overstatement)", () => {
  for (const e of FABRIC_ELEMENTS) {
    if (e.status === "pending") {
      assert.equal(e.repoRefs.length, 0, `${e.id} is pending but cites evidence`)
    } else {
      assert.ok(e.repoRefs.length >= 1, `${e.id} claims ${e.status} but cites no evidence`)
      for (const ref of e.repoRefs) {
        assert.ok(existsSync(join(repoRoot, ref)), `${e.id} → missing evidence ${ref}`)
      }
    }
    assert.ok(e.briefClaim.length > 0 && e.delivered.length > 0 && e.note.length > 0, `${e.id} lacks claim/delivered/note`)
  }
})

test("Edge compute now has offline-read runtime but still discloses edge inference gaps", () => {
  assert.equal(elementById("EDGE")!.status, "partial")
  assert.ok(elementById("EDGE")!.repoRefs.includes("public/sw.js"))
  assert.ok(elementById("EDGE")!.pendingAspects.some((p) => /edge inference/i.test(p)))
  for (const id of ["IOT", "CHAIN", "NFT", "DAO", "RAGMCP", "EDGE"]) {
    assert.notEqual(elementById(id)!.status, "pending", `${id} should be at least partial`)
  }
})

test("coverage is an honest weighted figure, not 100%, and partitions cleanly", () => {
  const s = fabricSummary()
  assert.equal(s.total, 8)
  assert.equal(s.built + s.partial + s.pending, s.total)
  assert.ok(s.coveragePct > 0 && s.coveragePct < 100, `coverage ${s.coveragePct}% should be candid`)
  assert.equal(byFabricStatus("built").length + byFabricStatus("partial").length + byFabricStatus("pending").length, 8)
})

test("CSV export is formula-injection-safe and includes the header", () => {
  const csv = toFabricCSV()
  assert.match(csv.split("\n")[0], /Id,Element,Brief claim,Delivered,Status,Note,Evidence,Pending aspects/)
  assert.equal(csv.split("\n").length, FABRIC_ELEMENTS.length + 1)
})
