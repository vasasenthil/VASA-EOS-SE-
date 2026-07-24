import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { buildProductionAcceptancePack, productionAcceptancePackToMarkdown } from "@/lib/governance/production-acceptance"

const output = process.argv[2] ?? "docs/generated/production-acceptance-pack.md"
const pack = buildProductionAcceptancePack()
const path = join(process.cwd(), output)
mkdirSync(dirname(path), { recursive: true })
writeFileSync(path, productionAcceptancePackToMarkdown(pack))
console.log(`Production acceptance pack written to ${output}`)
