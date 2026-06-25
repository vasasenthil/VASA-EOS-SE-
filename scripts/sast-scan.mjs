// Repo SAST scan — runs lib/security/sast over source files. Fails CI on any HIGH
// finding; medium/low are reported. Run: node --experimental-strip-types scripts/sast-scan.mjs
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, extname } from "node:path"
import { scanSast } from "../lib/security/sast.ts"

const ROOTS = ["app", "lib", "config", "components", "middleware.ts"]
const EXTS = new Set([".ts", ".tsx"])
const SKIP = new Set(["node_modules", ".next", ".git"])

function walk(p, out) {
  const s = statSync(p)
  if (s.isDirectory()) {
    if (SKIP.has(p.split("/").pop())) return
    for (const e of readdirSync(p)) walk(join(p, e), out)
  } else if (EXTS.has(extname(p)) || p.endsWith("middleware.ts")) {
    out.push({ path: p, content: readFileSync(p, "utf8") })
  }
}

const files = []
for (const r of ROOTS) { try { walk(r, files) } catch {} }

const findings = scanSast(files)
const high = findings.filter((f) => f.severity === "high")
for (const f of findings) console.error(`  ${f.severity.toUpperCase()} ${f.path}:${f.line} [${f.rule}] ${f.snippet}`)
if (high.length > 0) {
  console.error(`✗ sast: ${high.length} HIGH finding(s) across ${files.length} files`)
  process.exit(1)
}
console.log(`✓ sast: no HIGH findings (${findings.length} medium/low, ${files.length} files scanned)`)
