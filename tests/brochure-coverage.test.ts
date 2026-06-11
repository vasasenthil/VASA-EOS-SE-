import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  BROCHURE_CLAIMS,
  BROCHURE_AREAS,
  byArea,
  byStatus,
  brochureSummary,
  toCSV,
} from "@/lib/governance/brochure-coverage"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("every brochure area has at least one mapped claim", () => {
  for (const area of BROCHURE_AREAS) {
    assert.ok(byArea(area).length >= 1, `area ${area} has no mapped claim`)
  }
})

test("built/partial claims cite real repo evidence; pending cite nothing (no overstatement)", () => {
  for (const c of BROCHURE_CLAIMS) {
    if (c.status === "pending") {
      assert.equal(c.repoRef, "", `${c.id} is pending but cites a repo ref`)
    } else {
      assert.notEqual(c.repoRef, "", `${c.id} claims ${c.status} but cites no evidence`)
      assert.ok(existsSync(join(repoRoot, c.repoRef)), `${c.id} → missing evidence ${c.repoRef}`)
    }
  }
})

test("the map honestly discloses the major sovereign-grade gaps", () => {
  const pending = byStatus("pending").map((c) => c.id)
  for (const id of ["keys-hsm", "escrow-offswitch", "multicloud", "scale"]) {
    assert.ok(pending.includes(id), `expected ${id} disclosed as pending`)
  }
  // AI engines and live federation must not be overclaimed as fully built.
  assert.equal(BROCHURE_CLAIMS.find((c) => c.id === "engines")?.status, "partial")
  assert.equal(BROCHURE_CLAIMS.find((c) => c.id === "federation")?.status, "partial")
})

test("coverage score is an honest weighted figure, not 100%", () => {
  const s = brochureSummary()
  assert.equal(s.total, BROCHURE_CLAIMS.length)
  assert.equal(s.built + s.partial + s.pending, s.total)
  assert.ok(s.coveragePct > 0 && s.coveragePct < 100, `coverage ${s.coveragePct}% should be a candid mid-range`)
})

test("CSV export is formula-injection-safe and includes the header", () => {
  const csv = toCSV()
  assert.match(csv.split("\n")[0], /Area,Claim,Status,Note,Evidence/)
  assert.equal(csv.split("\n").length, BROCHURE_CLAIMS.length + 1)
})
