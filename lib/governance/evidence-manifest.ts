import { createHash } from "node:crypto"

import { inventoryLedgerToCsv } from "./inventory-ledger"
import { buildProductionAcceptancePack, productionAcceptancePackToMarkdown } from "./production-acceptance"

export interface EvidenceArtifactDigest {
  id: string
  label: string
  path: string
  mediaType: string
  sha256: string
  bytes: number
}

export interface GovernanceEvidenceManifest {
  generatedAt: string
  algorithm: "sha256"
  custodyOwner: string
  retentionClass: "sovereign-production-acceptance"
  reviewCadence: "per-release"
  artifacts: EvidenceArtifactDigest[]
}

function digest(content: string): { sha256: string; bytes: number } {
  return { sha256: createHash("sha256").update(content, "utf8").digest("hex"), bytes: Buffer.byteLength(content, "utf8") }
}

function artifact(id: string, label: string, path: string, mediaType: string, content: string): EvidenceArtifactDigest {
  return { id, label, path, mediaType, ...digest(content) }
}

export function buildGovernanceEvidenceManifest(input: { env?: Record<string, string | undefined>; generatedAt?: string; root?: string } = {}): GovernanceEvidenceManifest {
  const pack = buildProductionAcceptancePack(input)
  const acceptanceJson = JSON.stringify(pack, null, 2)
  const acceptanceMarkdown = productionAcceptancePackToMarkdown(pack)
  const inventoryJson = JSON.stringify(pack.inventory, null, 2)
  const inventoryCsv = inventoryLedgerToCsv(pack.inventory)
  return {
    generatedAt: pack.generatedAt,
    algorithm: "sha256",
    custodyOwner: "CISO Office",
    retentionClass: "sovereign-production-acceptance",
    reviewCadence: "per-release",
    artifacts: [
      artifact("acceptance-pack-json", "Production acceptance pack JSON", "/api/governance/acceptance-pack", "application/json", acceptanceJson),
      artifact("acceptance-pack-markdown", "Production acceptance pack Markdown", "/api/governance/acceptance-pack/markdown", "text/markdown", acceptanceMarkdown),
      artifact("inventory-ledger-json", "Governance inventory ledger JSON", "/api/governance/inventory-ledger", "application/json", inventoryJson),
      artifact("inventory-ledger-csv", "Governance inventory ledger CSV", "/api/governance/inventory-ledger/csv", "text/csv", inventoryCsv),
    ],
  }
}
