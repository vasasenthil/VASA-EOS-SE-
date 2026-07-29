import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { DEFAULT_ESCROW_PATHS, generateSourceEscrowManifest, sourceEscrowManifestToCSV } from "@/lib/sovereignty/escrow"

const repoRoot = process.cwd()

test("source escrow manifest hashes every declared custody artifact", () => {
  const manifest = generateSourceEscrowManifest({ release: "2026.07.21", generatedAt: "2026-07-21T00:00:00.000Z", repoRoot })

  assert.equal(manifest.moduleId, "L1-source-code-escrow")
  assert.equal(manifest.legalStatus, "executed-escrow-pending")
  assert.equal(manifest.artifacts.length, DEFAULT_ESCROW_PATHS.length)
  for (const artifact of manifest.artifacts) {
    assert.ok(existsSync(join(repoRoot, artifact.path)), artifact.path)
    assert.match(artifact.sha256, /^[0-9a-f]{64}$/)
    assert.ok(artifact.bytes > 0)
  }
})

test("source escrow manifest includes sovereign build and recovery commands", () => {
  const manifest = generateSourceEscrowManifest({ release: "2026.07.21", repoRoot })

  assert.ok(manifest.buildCommands.includes("pnpm install --frozen-lockfile"))
  assert.ok(manifest.buildCommands.includes("pnpm run build"))
  assert.ok(manifest.publicAssurance.some((line) => /No secrets/i.test(line)))
})

test("source escrow CSV is public-safe and has one row per artifact", () => {
  const manifest = generateSourceEscrowManifest({ release: "2026.07.21", repoRoot })
  const csv = sourceEscrowManifestToCSV(manifest)

  assert.equal(csv.trim().split("\r\n").length, manifest.artifacts.length + 1)
  assert.match(csv, /sha256/)
  assert.doesNotMatch(csv, /SUPABASE_SERVICE_ROLE_KEY|\.env|studentName|apaar/i)
})
