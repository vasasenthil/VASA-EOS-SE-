import { test } from "node:test"
import assert from "node:assert/strict"
import { scanForSecrets, scanSummary } from "@/lib/security/secret-scan"

test("detects a leaked PEM private key, AWS key and assigned secret", () => {
  const findings = scanForSecrets([
    { path: "a.ts", content: "-----BEGIN PRIVATE KEY-----\nMIIEvg...\n-----END PRIVATE KEY-----" },
    { path: "b.ts", content: 'const k = "AKIAIOSFODNN7EXAMPLE"' },
    { path: "c.ts", content: 'const apiKey = "abcd1234efgh5678ijkl9012mnop"' },
  ])
  const rules = findings.map((f) => f.rule)
  assert.ok(rules.includes("private-key"))
  assert.ok(rules.includes("aws-access-key"))
  assert.ok(rules.includes("assigned-secret"))
})

test("detects a GitHub token and an OpenAI-style key", () => {
  const f = scanForSecrets([
    { path: "x", content: "ghp_0123456789abcdefghijABCDEFGHIJ012345" },
    { path: "y", content: "sk-0123456789abcdefghijklmnop" },
  ])
  assert.ok(f.some((x) => x.rule === "gh-token"))
  assert.ok(f.some((x) => x.rule === "openai-key"))
})

test("allowlist: env-var reads and the demo password constant are not flagged", () => {
  const findings = scanForSecrets([
    { path: "config.ts", content: "return process.env.SUPABASE_SERVICE_ROLE_KEY || undefined" },
    { path: "demo.ts", content: 'export const DEMO_PASSWORD = "Vasa@Edu#2026"' },
    { path: "comment.ts", content: "// example: api_key = 'thisisaplaceholderkey1234'" },
  ])
  assert.deepEqual(findings, [])
})

test("summary reports clean vs dirty", () => {
  assert.equal(scanSummary([{ path: "ok", content: "const x = 1" }]).clean, true)
  assert.equal(scanSummary([{ path: "bad", content: 'token = "abcdefghijklmnopqrstuvwxyz12"' }]).clean, false)
})
