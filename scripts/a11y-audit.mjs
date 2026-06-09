// Repo accessibility (WCAG) audit — runs lib/accessibility/audit over JSX. Fails CI
// on any HIGH finding (e.g. images without alt text); medium/low are reported.
//   node --experimental-strip-types scripts/a11y-audit.mjs
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, extname } from "node:path"
import { scanA11y } from "../lib/accessibility/audit.ts"

const ROOTS = ["app", "components"]
const SKIP = new Set(["node_modules", ".next", ".git"])

function walk(p, out) {
  const s = statSync(p)
  if (s.isDirectory()) {
    if (SKIP.has(p.split("/").pop())) return
    for (const e of readdirSync(p)) walk(join(p, e), out)
  } else if (extname(p) === ".tsx") {
    out.push({ path: p, content: readFileSync(p, "utf8") })
  }
}

const files = []
for (const r of ROOTS) { try { walk(r, files) } catch {} }

const findings = scanA11y(files)
const high = findings.filter((f) => f.severity === "high")
for (const f of findings) console.error(`  ${f.severity.toUpperCase()} ${f.path}:${f.line} [${f.rule} · WCAG ${f.wcag}] ${f.snippet}`)
if (high.length > 0) {
  console.error(`✗ a11y-audit: ${high.length} HIGH finding(s) across ${files.length} JSX files`)
  process.exit(1)
}
console.log(`✓ a11y-audit: no HIGH findings (${findings.length} medium/low, ${files.length} JSX files scanned)`)
