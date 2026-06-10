import { test } from "node:test"
import assert from "node:assert/strict"
import { csvField, csvRow } from "@/lib/csv"

test("formula-injection leads are neutralised with a quote prefix", () => {
  assert.equal(csvField("=HYPERLINK(\"http://evil\")"), "\"'=HYPERLINK(\"\"http://evil\"\")\"")
  assert.equal(csvField("+cmd|/c calc"), "'+cmd|/c calc")
  assert.equal(csvField("@SUM(A1)"), "'@SUM(A1)")
  // a leading-minus formula trigger that is NOT a number is neutralised
  assert.equal(csvField("-2+3+cmd"), "'-2+3+cmd")
})

test("genuine negative numbers are preserved (not treated as formulas)", () => {
  assert.equal(csvField("-5"), "-5")
  assert.equal(csvField("-3.2"), "-3.2")
  assert.equal(csvField("42"), "42")
})

test("RFC-4180 quoting still applies (commas, quotes, newlines)", () => {
  assert.equal(csvField("Smith, John"), "\"Smith, John\"")
  assert.equal(csvField('she said "hi"'), '"she said ""hi"""')
  assert.equal(csvField("line1\nline2"), '"line1\nline2"')
  assert.equal(csvField("plain"), "plain")
})

test("a formula value that also needs quoting is both prefixed and quoted", () => {
  // leading = and contains a comma → prefix ' then wrap in quotes
  const out = csvField("=1,2")
  assert.ok(out.startsWith('"\'='))
  assert.ok(out.endsWith('"'))
})

test("csvRow joins safely-escaped cells", () => {
  assert.equal(csvRow(["a", "b,c", "=x"]), "a,\"b,c\",'=x")
})
