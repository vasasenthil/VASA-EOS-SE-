// Repo secret-leak scan — runs lib/security/secret-scan over tracked source files.
// Exits non-zero on any finding so CI fails before a credential is committed.
//   node --experimental-strip-types scripts/secret-scan.mjs
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, extname } from "node:path"
import { scanForSecrets } from "../lib/security/secret-scan.ts"

const ROOTS = ["app", "lib", "config", "components", "scripts", "middleware.ts"]
const EXTS = new Set([".ts", ".tsx", ".mjs", ".js", ".sql", ".yml", ".yaml", ".env"])
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
for (const r of ROOTS) {
  try { walk(r, files) } catch {}
}

const findings = scanForSecrets(files)
if (findings.length > 0) {
  console.error(`✗ secret-scan: ${findings.length} finding(s) across ${files.length} files`)
  for (const f of findings) console.error(`  ${f.path}:${f.line} [${f.rule}] ${f.snippet}`)
  process.exit(1)
}
console.log(`✓ secret-scan: clean (${files.length} files scanned)`)
