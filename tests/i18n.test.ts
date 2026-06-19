import { test } from "node:test"
import assert from "node:assert/strict"
import { LOCALES } from "@/lib/i18n"
import { resources } from "@/lib/i18n/resources"
import { CORE_KEYS, translate, localeCoverage, coverageReport } from "@/lib/i18n/translate"

test("every advertised locale has a resource catalogue (no empty locale in the switcher)", () => {
  for (const l of LOCALES) {
    assert.ok(resources[l.code], `locale ${l.code} is advertised but has no catalogue`)
    assert.ok(Object.keys(resources[l.code].translation).length >= 1, `locale ${l.code} catalogue is empty`)
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
  assert.equal(translate("ta", "nonexistent.key"), "nonexistent.key")
})

test("the demo keys the multilingual page renders stay localised in Tamil", () => {
  for (const k of ["language", "welcome", "demo.heading", "nav.dashboard", "nav.attendance", "nav.fees", "nav.schemes"]) {
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
