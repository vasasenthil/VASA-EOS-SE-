import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  CABINET_NOTE_SECTIONS,
  CABINET_NOTES,
  mandatorySections,
  validateNote,
  noteById,
  byStatus,
  cabinetNoteSummary,
  toCSV,
} from "@/lib/governance/cabinet-note"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("the Secretariat-mandated note anatomy is present and well-formed", () => {
  const keys = CABINET_NOTE_SECTIONS.map((s) => s.key)
  for (const required of ["subject", "background", "proposal", "financial", "legal", "consultation", "recommendation"]) {
    assert.ok(keys.includes(required), `missing section ${required}`)
  }
  assert.ok(mandatorySections().length >= 1)
})

test("every section cites a real informing module on disk (self-verifying)", () => {
  for (const s of CABINET_NOTE_SECTIONS) {
    assert.ok(existsSync(join(repoRoot, s.sourceRef)), `${s.key} → missing source ${s.sourceRef}`)
  }
})

test("a fully-drafted note validates; an incomplete draft is caught", () => {
  assert.equal(validateNote(noteById("CN-FLN-01")!).ok, true)
  const draft = validateNote(noteById("CN-CADRE-03")!)
  assert.equal(draft.ok, false)
  assert.ok(draft.missing.includes("consultation"), "should flag the omitted consultation section")
})

test("validateNote treats whitespace-only content as missing", () => {
  const note = { id: "X", subject: "x", status: "draft" as const, content: { subject: "   " } }
  const v = validateNote(note)
  assert.equal(v.ok, false)
  assert.ok(v.missing.includes("subject"))
})

test("summary tallies status, mandatory sections and completeness", () => {
  const s = cabinetNoteSummary()
  assert.equal(s.notes, CABINET_NOTES.length)
  assert.equal(s.approved + s.vetted + s.draft, s.notes)
  assert.equal(s.mandatorySections, mandatorySections().length)
  assert.ok(s.complete >= 1 && s.complete < s.notes) // at least one complete, at least one incomplete
  assert.ok(byStatus("approved").length >= 1)
})

test("CSV has a header plus one row per note and flags completeness", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "ID,Subject,Status,Complete,Missing sections")
  assert.equal(lines.length, CABINET_NOTES.length + 1)
})
