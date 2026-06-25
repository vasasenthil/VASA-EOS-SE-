import { test } from "node:test"
import assert from "node:assert/strict"
import { LOCALES } from "@/lib/i18n"
import { resources } from "@/lib/i18n/resources"
import { CORE_KEYS, MESSAGE_KEYS, translate, t, localeCoverage, coverageReport, type MessageKey } from "@/lib/i18n/translate"

test("every advertised locale has a resource catalogue (no empty locale in the switcher)", () => {
  for (const l of LOCALES) {
    assert.ok(resources[l.code], `locale ${l.code} is advertised but has no catalogue`)
    assert.ok(Object.keys(resources[l.code].translation).length >= 1, `locale ${l.code} catalogue is empty`)
  }
})

test("type-safe code-first integrity: keys are the English reference, no orphan keys, no duplicates", () => {
  // CORE_KEYS === MESSAGE_KEYS, and they exactly mirror the English reference catalogue.
  assert.deepEqual([...CORE_KEYS], [...MESSAGE_KEYS])
  assert.deepEqual([...MESSAGE_KEYS].sort(), Object.keys(resources.en.translation).sort())
  // no duplicate keys in the committed set
  assert.equal(new Set(MESSAGE_KEYS).size, MESSAGE_KEYS.length)
  // runtime mirror of the compile-time guarantee: no locale carries an orphan key (one ∉ MESSAGE_KEYS)
  const allowed = new Set<string>(MESSAGE_KEYS)
  for (const l of LOCALES) {
    for (const k of Object.keys(resources[l.code].translation)) {
      assert.ok(allowed.has(k), `locale ${l.code} has orphan key '${k}' not in MESSAGE_KEYS`)
    }
  }
})

test("English is the reference set; Tamil and Hindi are FULLY localised (Tamil-first)", () => {
  assert.ok(CORE_KEYS.length >= 20, "core key set should be substantive")
  assert.equal(localeCoverage("en").pct, 100)
  assert.equal(localeCoverage("ta").pct, 100) // primary
  assert.equal(localeCoverage("hi").pct, 100) // national link
  assert.equal(localeCoverage("ta").missing.length, 0)
})

test("neighbouring scheduled languages are honestly PARTIAL, not overclaimed", () => {
  for (const code of ["te", "ml", "kn", "ur"] as const) {
    const c = localeCoverage(code)
    assert.ok(c.pct > 0 && c.pct < 100, `${code} should be a candid partial coverage, got ${c.pct}%`)
    assert.ok(c.missing.length > 0, `${code} should disclose its missing keys`)
    // a core nav string IS localised (not just a fallback)
    assert.notEqual(resources[code].translation["nav.attendance"], undefined)
  }
})

test("translate: native string when present, English fallback otherwise, key as last resort", () => {
  assert.equal(translate("ta", "nav.dashboard"), "டாஷ்போர்டு")
  assert.equal(translate("ur", "welcome"), "خوش آمدید")
  // a key only English has → te falls back to English, not the raw key
  assert.equal(translate("te", "signOut"), "Sign out")
  // an unknown key (cast past the type guard) returns the key itself — the runtime last resort
  assert.equal(translate("ta", "nonexistent.key" as MessageKey), "nonexistent.key")
})

test("t(): code-first translator defaults to the Tamil-first locale, overridable", () => {
  assert.equal(t("nav.fees"), "கட்டணம்") // default locale = ta
  assert.equal(t("nav.fees", "en"), "Fees")
  assert.equal(t("welcome", "hi"), "स्वागत है")
})

test("the demo keys the multilingual page renders stay localised in Tamil", () => {
  const keys: MessageKey[] = ["language", "welcome", "demo.heading", "nav.dashboard", "nav.attendance", "nav.fees", "nav.schemes"]
  for (const k of keys) {
    assert.notEqual(translate("ta", k), k, `Tamil missing demo key ${k}`)
    assert.notEqual(translate("ta", k), translate("en", k), `Tamil ${k} should differ from English`)
  }
})

test("coverageReport is honest: complete + partial accounting, average is a candid mid-high", () => {
  const r = coverageReport()
  assert.equal(r.total, LOCALES.length)
  assert.equal(r.coreKeys, CORE_KEYS.length)
  assert.equal(r.complete, 3) // en, ta, hi
  assert.equal(r.partial, 4) // te, ml, kn, ur
  assert.equal(r.complete + r.partial, r.total) // none at 0%
  assert.ok(r.averagePct > 50 && r.averagePct < 100, `average ${r.averagePct}% should be a candid mid-high`)
})
