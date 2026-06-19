import { test } from "node:test"
import assert from "node:assert/strict"
import { LOCALES } from "@/lib/i18n"
import { MESSAGE_KEYS } from "@/lib/i18n/resources"
import { exportLocale, exportCatalogue, serializeBundle, validateCatalogue } from "@/lib/i18n/tms"

test("exportLocale: English is the complete source template", () => {
  const en = exportLocale("en")
  assert.equal(en.complete, true)
  assert.equal(en.missing.length, 0)
  assert.equal(Object.keys(en.messages).length, MESSAGE_KEYS.length)
})

test("exportLocale: a partial locale reports present messages and the honest gap list", () => {
  const te = exportLocale("te")
  assert.equal(te.complete, false)
  assert.ok(te.missing.length > 0)
  // present keys carry real strings; missing keys are absent from messages (not blank-filled)
  assert.equal(te.messages["nav.attendance"], "హాజరు")
  assert.equal(te.messages["signOut"], undefined)
  assert.ok(te.missing.includes("signOut"))
})

test("serializeBundle: deterministic (sorted locales + keys) for clean TMS Git diffs", () => {
  const a = serializeBundle()
  const b = serializeBundle()
  assert.equal(a, b) // stable
  const parsed = JSON.parse(a) as Record<string, Record<string, string>>
  assert.deepEqual(Object.keys(parsed), [...LOCALES].map((l) => l.code).sort())
  // keys within a locale are sorted
  const enKeys = Object.keys(parsed.en)
  assert.deepEqual(enKeys, [...enKeys].sort())
  assert.equal(parsed.ta["nav.fees"], "கட்டணம்")
})

test("exportCatalogue covers every advertised locale exactly once", () => {
  const cat = exportCatalogue()
  assert.equal(cat.length, LOCALES.length)
  assert.deepEqual(cat.map((c) => c.locale).sort(), [...LOCALES].map((l) => l.code).sort())
})

test("validateCatalogue: a clean TMS import passes; orphan keys are rejected", () => {
  // a translator fills every committed key → clean, 100%
  const full: Record<string, string> = {}
  for (const k of MESSAGE_KEYS) full[k] = "x"
  const ok = validateCatalogue("ta", full)
  assert.equal(ok.ok, true)
  assert.equal(ok.orphanKeys.length, 0)
  assert.equal(ok.coveragePct, 100)
  assert.equal(ok.missingKeys.length, 0)

  // an orphan key (typo / removed-from-source) fails the gate
  const dirty = { ...full, "nav.dashbaord": "oops" }
  const bad = validateCatalogue("ta", dirty)
  assert.equal(bad.ok, false)
  assert.deepEqual(bad.orphanKeys, ["nav.dashbaord"])
})

test("validateCatalogue: a partial import is allowed and reported honestly (blanks = missing)", () => {
  const partial: Record<string, string> = { "nav.dashboard": "டாஷ்போர்டு", "nav.fees": "", welcome: "வரவேற்பு" }
  const v = validateCatalogue("ta", partial)
  assert.equal(v.ok, true) // no orphan keys → mergeable
  assert.ok(v.filledKeys.includes("nav.dashboard"))
  assert.ok(v.filledKeys.includes("welcome"))
  assert.ok(v.missingKeys.includes("nav.fees")) // blank counts as missing, not filled
  assert.ok(v.coveragePct > 0 && v.coveragePct < 100)
})
