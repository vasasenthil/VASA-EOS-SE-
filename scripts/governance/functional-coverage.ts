import { mkdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { buildFunctionalCoverageReport, functionalCoverageToMarkdown } from "../../lib/governance/functional-coverage"

const output = resolve(process.cwd(), "docs/generated/functional-module-coverage.md")
mkdirSync(resolve(process.cwd(), "docs/generated"), { recursive: true })
writeFileSync(output, functionalCoverageToMarkdown(buildFunctionalCoverageReport()), "utf8")
console.log(`Functional coverage written to ${output}`)
