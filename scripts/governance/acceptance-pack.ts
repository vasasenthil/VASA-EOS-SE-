import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { buildGovernanceEvidenceManifest } from "@/lib/governance/evidence-manifest"
import { buildProductionAcceptancePack, productionAcceptancePackToMarkdown } from "@/lib/governance/production-acceptance"

const markdownOutput = process.argv[2] ?? "docs/generated/production-acceptance-pack.md"
const manifestOutput = process.argv[3] ?? "docs/generated/production-acceptance-manifest.json"
const generatedAt = new Date().toISOString()
const pack = buildProductionAcceptancePack({ generatedAt })
const manifest = buildGovernanceEvidenceManifest({ generatedAt })

function writeGeneratedFile(output: string, content: string) {
  const path = join(process.cwd(), output)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
  console.log(`Production acceptance artefact written to ${output}`)
}

writeGeneratedFile(markdownOutput, productionAcceptancePackToMarkdown(pack))
writeGeneratedFile(manifestOutput, `${JSON.stringify(manifest, null, 2)}\n`)
