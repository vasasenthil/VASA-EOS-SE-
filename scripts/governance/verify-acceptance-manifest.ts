import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { buildGovernanceEvidenceManifest, type GovernanceEvidenceManifest } from "@/lib/governance/evidence-manifest"

const markdownInput = process.argv[2] ?? "docs/generated/production-acceptance-pack.md"
const manifestInput = process.argv[3] ?? "docs/generated/production-acceptance-manifest.json"

function sha256(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex")
}

function fail(message: string): never {
  console.error(`Acceptance manifest verification failed: ${message}`)
  process.exit(1)
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) fail(`${label} expected ${String(expected)} but received ${String(actual)}`)
}

const manifestPath = join(process.cwd(), manifestInput)
const markdownPath = join(process.cwd(), markdownInput)
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as GovernanceEvidenceManifest
const markdown = readFileSync(markdownPath, "utf8")
const expected = buildGovernanceEvidenceManifest({ generatedAt: manifest.generatedAt })

assertEqual(manifest.algorithm, "sha256", "algorithm")
assertEqual(manifest.custodyOwner, "CISO Office", "custody owner")
assertEqual(manifest.retentionClass, "sovereign-production-acceptance", "retention class")
assertEqual(manifest.reviewCadence, "per-release", "review cadence")
assertEqual(markdown.includes(`Generated: ${manifest.generatedAt}`), true, "markdown timestamp")

for (const expectedArtifact of expected.artifacts) {
  const actual = manifest.artifacts.find((artifact) => artifact.id === expectedArtifact.id)
  if (!actual) fail(`missing artifact ${expectedArtifact.id}`)
  assertEqual(actual.path, expectedArtifact.path, `${actual.id} path`)
  assertEqual(actual.mediaType, expectedArtifact.mediaType, `${actual.id} media type`)
  assertEqual(actual.sha256, expectedArtifact.sha256, `${actual.id} sha256`)
  assertEqual(actual.bytes, expectedArtifact.bytes, `${actual.id} byte count`)
}

const markdownArtifact = manifest.artifacts.find((artifact) => artifact.id === "acceptance-pack-markdown")
if (!markdownArtifact) fail("missing acceptance-pack-markdown artifact")
assertEqual(sha256(markdown), markdownArtifact.sha256, "generated markdown sha256")
assertEqual(Buffer.byteLength(markdown, "utf8"), markdownArtifact.bytes, "generated markdown bytes")

console.log(`Acceptance manifest verified: ${manifest.artifacts.length} artefacts, generated ${manifest.generatedAt}`)
