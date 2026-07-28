import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { buildReadinessLedger, readinessLedgerToCsv, readinessLedgerToMarkdown } from "@/lib/governance/readiness-ledger"

test("readiness ledger inventories and ranks unfinished production signals", () => {
  const root = mkdtempSync(join(tmpdir(), "vasa-readiness-"))
  mkdirSync(join(root, "lib", "auth"), { recursive: true }); mkdirSync(join(root, "lib", "teacher"), { recursive: true }); mkdirSync(join(root, "lib", "platform"), { recursive: true })
  writeFileSync(join(root, "lib", "auth", "session.ts"), "// TODO: replace temporary session\n")
  writeFileSync(join(root, "lib", "teacher", "store.ts"), "// in-memory fallback\n")
  writeFileSync(join(root, "lib", "platform", "provider.ts"), 'export const result = { mode: "mock" }\n')
  const ledger = buildReadinessLedger(root, "2026-07-27T00:00:00.000Z")
  assert.equal(ledger.scannedFiles, 3); assert.equal(ledger.findings.length, 3)
  assert.equal(ledger.findings[0].path, "lib/auth/session.ts"); assert.equal(ledger.findings[0].classification, "not-built"); assert.equal(ledger.findings[0].domain, "safety")
  assert.deepEqual(ledger.findings.map((finding) => finding.rank), [1, 2, 3]); assert.ok(ledger.findings[0].score >= ledger.findings[1].score)
})

test("readiness ledger does not mistake form placeholder text for stub code", () => {
  const root = mkdtempSync(join(tmpdir(), "vasa-readiness-ui-"))
  mkdirSync(join(root, "app"), { recursive: true })
  writeFileSync(join(root, "app", "form.tsx"), '<input placeholder="Student name" />\n')
  assert.equal(buildReadinessLedger(root).findings.length, 0)
})

test("readiness ledger exports machine-readable and decision-readable evidence", () => {
  const ledger = buildReadinessLedger(process.cwd(), "2026-07-27T00:00:00.000Z")
  const csv = readinessLedgerToCsv(ledger); const markdown = readinessLedgerToMarkdown(ledger)
  assert.ok(ledger.scannedFiles > 1_000); assert.ok(ledger.findings.length > 0)
  assert.match(csv, /^rank,score,classification,domain,path,reason/m); assert.match(markdown, /Evidence standard: \*\*production proof\*\*/); assert.match(markdown, /Balanced sovereign risk score/); assert.match(markdown, /## Ranked backlog/)
})

test("governance readiness page provides the ranked, role-protected remediation surface", () => {
  const source = readFileSync(join(process.cwd(), "app/governance/readiness/page.tsx"), "utf8")
  assert.match(source, /ADMIN.*SECRETARY.*DIRECTOR/)
  assert.match(source, /Ranked remediation queue/)
  assert.match(source, /Download complete CSV/)
  assert.match(source, /externally gated capability evidence/i)
})
