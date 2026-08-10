import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { csvField } from "@/lib/csv"

export interface EscrowArtifact {
  path: string
  purpose: string
  sha256: string
  bytes: number
}

export interface SourceEscrowManifest {
  manifestId: string
  moduleId: "L1-source-code-escrow"
  release: string
  generatedAt: string
  repoRoot: string
  artifacts: EscrowArtifact[]
  buildCommands: string[]
  legalStatus: "technical-manifest-ready" | "executed-escrow-pending"
  publicAssurance: string[]
}

export const DEFAULT_ESCROW_PATHS: { path: string; purpose: string }[] = [
  { path: "package.json", purpose: "Application scripts and dependency contract" },
  { path: "pnpm-lock.yaml", purpose: "Reproducible dependency lockfile" },
  { path: "Dockerfile", purpose: "State-operable application container build" },
  { path: ".github/workflows/sovereign-deploy.yml", purpose: "Sovereign CI/CD release workflow" },
  { path: "migrations/manifest.json", purpose: "Ordered database migration manifest" },
  { path: "platform/L1-foundation/off-switch-svc/offswitch.go", purpose: "T0 M-of-N sovereign off-switch implementation" },
]

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)).digest("hex")
}

export function generateSourceEscrowManifest(input: {
  release: string
  generatedAt?: string
  repoRoot?: string
  paths?: { path: string; purpose: string }[]
}): SourceEscrowManifest {
  const repoRoot = input.repoRoot ?? process.cwd()
  const artifacts = (input.paths ?? DEFAULT_ESCROW_PATHS).map((artifact): EscrowArtifact => {
    const bytes = readFileSync(join(repoRoot, artifact.path))
    return { ...artifact, bytes: bytes.byteLength, sha256: sha256(bytes) }
  })
  return {
    manifestId: `ESCROW-${input.release}`,
    moduleId: "L1-source-code-escrow",
    release: input.release,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    repoRoot,
    artifacts,
    buildCommands: ["corepack enable", "pnpm install --frozen-lockfile", "pnpm run typecheck", "pnpm test", "pnpm run build"],
    legalStatus: "executed-escrow-pending",
    publicAssurance: [
      "The manifest is a technical escrow bill of materials; the executed legal escrow agreement remains a State procurement/legal step.",
      "Each artifact is SHA-256 hashed so Tamil Nadu can verify custody packages before build or disaster recovery.",
      "No secrets, .env values, child records or production credentials are included in the escrow manifest.",
    ],
  }
}

export function sourceEscrowManifestToCSV(manifest: SourceEscrowManifest): string {
  const header = ["path", "purpose", "sha256", "bytes"]
  const rows = manifest.artifacts.map((artifact) => [artifact.path, artifact.purpose, artifact.sha256, String(artifact.bytes)])
  return [header, ...rows].map((row) => row.map(csvField).join(",")).join("\r\n") + "\r\n"
}
