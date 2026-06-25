import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  DIRECTORATES,
  directorateById,
  byStatus,
  directorateSummary,
  toCSV,
} from "@/lib/governance/directorates"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("all seven directorates are present and well-formed", () => {
  assert.equal(DIRECTORATES.length, 7)
  const ids = new Set<string>()
  for (const d of DIRECTORATES) {
    assert.ok(!ids.has(d.id), `duplicate ${d.id}`)
    ids.add(d.id)
    assert.ok(d.name && d.abbr && d.mandate && d.focus)
    assert.ok(["supported", "partial"].includes(d.status))
  }
})

test("every directorate's module reference exists on disk (self-verifying)", () => {
  for (const d of DIRECTORATES) {
    assert.ok(existsSync(join(repoRoot, d.moduleRef)), `${d.id} → missing module ${d.moduleRef}`)
  }
})

test("key directorates map to the expected specialised module", () => {
  assert.equal(directorateById("dge")?.moduleRef, "lib/exams/integrity.ts") // exams → integrity
  assert.equal(directorateById("scert")?.moduleRef, "lib/cpd/index.ts") // teacher training → CPD
  assert.equal(directorateById("private-regulation")?.moduleRef, "lib/recognition/index.ts") // recognition
})

test("summary tallies directorates, support status and distinct modules", () => {
  const s = directorateSummary()
  assert.equal(s.directorates, 7)
  assert.equal(s.supported + s.partial, s.directorates)
  assert.ok(s.supported >= 1)
  assert.ok(s.modulesLinked >= 1 && s.modulesLinked <= s.directorates)
  assert.ok(byStatus("supported").length >= 1)
})

test("CSV has a header plus one row per directorate", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Abbr,Name,Mandate,Focus,Module,Status")
  assert.equal(lines.length, DIRECTORATES.length + 1)
})
