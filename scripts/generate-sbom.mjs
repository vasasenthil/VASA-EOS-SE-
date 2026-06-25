// Generate a CycloneDX 1.5 SBOM (sbom.json) from package.json.
//   node --experimental-strip-types scripts/generate-sbom.mjs
import { readFileSync, writeFileSync } from "node:fs"
import { buildSbom, sbomSummary } from "../lib/security/sbom.ts"

const pkg = JSON.parse(readFileSync("package.json", "utf8"))
const bom = buildSbom(pkg, { includeDev: true })
writeFileSync("sbom.json", JSON.stringify(bom, null, 2) + "\n")
const s = sbomSummary(bom)
console.log(`✓ SBOM written to sbom.json — ${s.components} components (${s.required} required, ${s.optional} dev)`)
