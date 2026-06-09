import { test } from "node:test"
import assert from "node:assert/strict"
import {
  normalizePrefs,
  parseStoredPrefs,
  a11yClassList,
  A11Y_CLASSES,
  DEFAULT_A11Y,
} from "@/lib/accessibility"

test("normalizePrefs returns defaults for non-object input", () => {
  assert.deepEqual(normalizePrefs(null), DEFAULT_A11Y)
  assert.deepEqual(normalizePrefs("nope"), DEFAULT_A11Y)
  assert.deepEqual(normalizePrefs(42), DEFAULT_A11Y)
})

test("normalizePrefs coerces partial and invalid fields", () => {
  const p = normalizePrefs({ highContrast: true, textScale: "huge", locale: "" })
  assert.equal(p.highContrast, true)
  assert.equal(p.textScale, "normal") // invalid -> default
  assert.equal(p.locale, DEFAULT_A11Y.locale) // empty -> default
  assert.equal(p.reduceMotion, false)
})

test("normalizePrefs preserves valid values", () => {
  const p = normalizePrefs({ textScale: "xlarge", reduceMotion: true, voiceFirst: true, locale: "en" })
  assert.equal(p.textScale, "xlarge")
  assert.equal(p.reduceMotion, true)
  assert.equal(p.voiceFirst, true)
  assert.equal(p.locale, "en")
})

test("parseStoredPrefs handles null and malformed JSON", () => {
  assert.deepEqual(parseStoredPrefs(null), DEFAULT_A11Y)
  assert.deepEqual(parseStoredPrefs("{not json"), DEFAULT_A11Y)
})

test("parseStoredPrefs round-trips a stored object", () => {
  const stored = JSON.stringify({ highContrast: true, textScale: "large" })
  const p = parseStoredPrefs(stored)
  assert.equal(p.highContrast, true)
  assert.equal(p.textScale, "large")
})

test("a11yClassList maps active toggles to managed classes", () => {
  assert.deepEqual(a11yClassList(DEFAULT_A11Y), [])
  assert.deepEqual(a11yClassList({ ...DEFAULT_A11Y, highContrast: true }), ["a11y-high-contrast"])
  assert.deepEqual(
    a11yClassList({ ...DEFAULT_A11Y, highContrast: true, reduceMotion: true }),
    ["a11y-high-contrast", "a11y-reduce-motion"],
  )
})

test("every emitted class is in the managed A11Y_CLASSES set", () => {
  const all = a11yClassList({ ...DEFAULT_A11Y, highContrast: true, reduceMotion: true })
  for (const c of all) assert.ok((A11Y_CLASSES as readonly string[]).includes(c))
})
