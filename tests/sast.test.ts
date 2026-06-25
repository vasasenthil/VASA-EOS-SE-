import { test } from "node:test"
import assert from "node:assert/strict"
import { scanSast, sastSummary } from "@/lib/security/sast"

test("flags high-severity execution + unsafe-HTML patterns", () => {
  const f = scanSast([
    { path: "a.ts", content: "const r = eval(userInput)" },
    { path: "b.ts", content: "import { exec } from 'child_process'" },
    { path: "c.tsx", content: "<div dangerouslySetInnerHTML={{ __html: x }} />" },
  ])
  const rules = f.map((x) => x.rule)
  assert.ok(rules.includes("eval-use"))
  assert.ok(rules.includes("child-process"))
  assert.ok(rules.includes("dangerous-html"))
  assert.ok(f.every((x) => x.severity === "high"))
})

test("flags medium-severity hygiene issues", () => {
  const f = scanSast([
    { path: "x.ts", content: "const token = Math.random().toString()" },
    { path: "y.ts", content: "createHash('md5')" },
    { path: "z.ts", content: 'fetch("http://api.example.com/v1")' },
  ])
  assert.ok(f.some((x) => x.rule === "insecure-token-random"))
  assert.ok(f.some((x) => x.rule === "weak-hash"))
  assert.ok(f.some((x) => x.rule === "non-tls-url"))
})

test("allowlists comments, an explicit sast-ignore, and the scanner's own files", () => {
  const f = scanSast([
    { path: "ok.ts", content: "// eval( is fine in a comment" },
    { path: "ok2.tsx", content: "<x dangerouslySetInnerHTML={y} /> // sast-ignore: reviewed" },
    { path: "lib/security/rules.ts", content: "eval(" }, // the scanner's own dir
  ])
  assert.deepEqual(f, [])
})

test("localhost http is not flagged; external http is", () => {
  assert.equal(scanSast([{ path: "a.ts", content: 'const u = "http://localhost:4318"' }]).length, 0)
  assert.equal(scanSast([{ path: "b.ts", content: 'const u = "http://collector.gov.in"' }]).length, 1)
})

test("summary gate passes only with zero high findings", () => {
  assert.equal(sastSummary([{ path: "ok", content: "const x = 1" }]).passesGate, true)
  assert.equal(sastSummary([{ path: "bad", content: "eval(z)" }]).passesGate, false)
})
