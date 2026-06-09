import { test } from "node:test"
import assert from "node:assert/strict"
import {
  SCHEDULED_LANGUAGES,
  ADDITIONAL_LANGUAGES,
  LANGUAGE_CATALOGUE,
  languageByCode,
  byTnRole,
  scripts,
  languageSummary,
  toCSV,
} from "@/lib/i18n/languages"

test("the catalogue carries exactly the 22 Eighth-Schedule languages", () => {
  assert.equal(SCHEDULED_LANGUAGES.length, 22)
  assert.ok(SCHEDULED_LANGUAGES.every((l) => l.scheduled))
  // codes are unique across the whole catalogue
  const codes = new Set<string>()
  for (const l of LANGUAGE_CATALOGUE) {
    assert.ok(!codes.has(l.code), `duplicate code ${l.code}`)
    codes.add(l.code)
    assert.ok(l.name && l.nativeName && l.script)
  }
})

test("Tamil is the single primary language for the TN deployment", () => {
  const primary = byTnRole("primary")
  assert.equal(primary.length, 1)
  assert.equal(primary[0].code, "ta")
  assert.equal(languageByCode("ta")?.nativeName, "தமிழ்")
})

test("neighbour-state languages (te/kn/ml/ur) are present and scheduled", () => {
  for (const c of ["te", "kn", "ml", "ur"]) {
    const l = languageByCode(c)
    assert.ok(l?.scheduled)
    assert.equal(l?.tnRole, "neighbour")
  }
})

test("additional languages cover the link language and TN tribal/minority tongues", () => {
  assert.ok(ADDITIONAL_LANGUAGES.every((l) => !l.scheduled))
  assert.equal(languageByCode("en")?.tnRole, "link")
  assert.ok(byTnRole("tribal-minority").length >= 5) // Saurashtra, Badaga, Irula, Toda, Kota, Kurumba
})

test("scripts are de-duplicated and sorted for font-coverage planning", () => {
  const s = scripts()
  assert.deepEqual(s, [...new Set(s)].sort())
  assert.ok(s.includes("Tamil") && s.includes("Devanagari"))
})

test("summary counts scheduled vs additional and distinct scripts", () => {
  const sum = languageSummary()
  assert.equal(sum.scheduled, 22)
  assert.equal(sum.total, LANGUAGE_CATALOGUE.length)
  assert.equal(sum.scheduled + sum.additional, sum.total)
  assert.equal(sum.scripts, scripts().length)
})

test("CSV has a header plus one row per language", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Code,Name,Native name,Script,Eighth Schedule,TN role")
  assert.equal(lines.length, LANGUAGE_CATALOGUE.length + 1)
})
