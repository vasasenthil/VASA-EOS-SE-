import { test } from "node:test"
import assert from "node:assert/strict"
import { scanA11y, a11ySummary } from "@/lib/accessibility/audit"

test("flags an <img> without alt text as HIGH (WCAG 1.1.1)", () => {
  const f = scanA11y([{ path: "a.tsx", content: '<img src="x.png" />' }])
  assert.equal(f.length, 1)
  assert.equal(f[0].rule, "img-no-alt")
  assert.equal(f[0].severity, "high")
})

test("an <img> with alt is clean", () => {
  assert.deepEqual(scanA11y([{ path: "a.tsx", content: '<img src="x.png" alt="chart" />' }]), [])
})

test('an empty alt="" is accepted for decorative images', () => {
  assert.deepEqual(scanA11y([{ path: "a.tsx", content: '<img src="divider.svg" alt="" />' }]), [])
})

test("positive tabIndex and autoFocus are flagged; negative tabIndex is not", () => {
  assert.ok(scanA11y([{ path: "a.tsx", content: "<div tabIndex={3}>" }]).some((x) => x.rule === "positive-tabindex"))
  assert.ok(scanA11y([{ path: "a.tsx", content: "<input autoFocus />" }]).some((x) => x.rule === "autofocus"))
  assert.deepEqual(scanA11y([{ path: "a.tsx", content: "<main tabIndex={-1}>" }]), [])
})

test("mixed-case attributes are still scanned", () => {
  const findings = scanA11y([{ path: "a.tsx", content: '<IMG SRC="x.png" />\n<input AUTOFOCUS />' }])
  assert.ok(findings.some((x) => x.rule === "img-no-alt"))
  assert.ok(findings.some((x) => x.rule === "autofocus"))
})

test("target=_blank without rel is flagged across a multi-line anchor", () => {
  const bad = '<a\n  href="x"\n  target="_blank"\n>link</a>'
  assert.ok(scanA11y([{ path: "a.tsx", content: bad }]).some((x) => x.rule === "target-blank-no-rel"))
  // rel on a different line of the same tag => NOT flagged (no false positive)
  const good = '<a\n  href="x"\n  target="_blank"\n  rel="noopener noreferrer"\n>link</a>'
  assert.deepEqual(scanA11y([{ path: "a.tsx", content: good }]), [])
})

test("single-quoted JSX attributes are handled", () => {
  const findings = scanA11y([{ path: "a.tsx", content: "<a href='x' target='_blank'>link</a>\n<div tabIndex='2' />" }])
  assert.ok(findings.some((x) => x.rule === "target-blank-no-rel"))
  assert.ok(findings.some((x) => x.rule === "positive-tabindex"))
})

test("multiple findings in one file preserve rule and line details", () => {
  const findings = scanA11y([{ path: "a.tsx", content: '<img src="x.png" />\n<input autoFocus />\n<a href="x" target="_blank">link</a>' }])
  assert.deepEqual(
    findings.map((x) => [x.rule, x.line]),
    [
      ["img-no-alt", 1],
      ["autofocus", 2],
      ["target-blank-no-rel", 3],
    ],
  )
})

test("only .tsx files are scanned; comments and a11y-ignore are allowlisted", () => {
  assert.deepEqual(scanA11y([{ path: "a.ts", content: '<img src="x" />' }]), []) // not JSX
  assert.deepEqual(scanA11y([{ path: "a.tsx", content: '// <img src="x" />' }]), []) // comment
  assert.deepEqual(scanA11y([{ path: "a.tsx", content: '<img src="x" /> {/* a11y-ignore */}' }]), [])
})

test("summary gate passes only with zero high findings", () => {
  assert.equal(a11ySummary([{ path: "a.tsx", content: "<div autoFocus />" }]).passesGate, true) // low only
  assert.equal(a11ySummary([{ path: "a.tsx", content: "<img src=x />" }]).passesGate, false) // high
})
