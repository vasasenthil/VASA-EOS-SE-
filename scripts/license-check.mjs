// License-compliance check — reads each production dependency's SPDX license from
// node_modules and classifies it against the government-OSS policy. Fails CI on any
// DENIED (strong-copyleft / non-OSS) license. Run:
//   node --experimental-strip-types scripts/license-check.mjs
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { checkLicenses, licenseSummary } from "../lib/security/license-policy.ts"

const pkg = JSON.parse(readFileSync("package.json", "utf8"))
const names = Object.keys(pkg.dependencies ?? {})

function licenseOf(name) {
  const p = join("node_modules", name, "package.json")
  if (!existsSync(p)) return undefined
  try {
    const m = JSON.parse(readFileSync(p, "utf8"))
    if (typeof m.license === "string") return m.license
    if (m.license?.type) return m.license.type
    if (Array.isArray(m.licenses) && m.licenses[0]?.type) return m.licenses[0].type
  } catch {}
  return undefined
}

const items = names.map((name) => ({ name, license: licenseOf(name) }))
const s = licenseSummary(items)
const findings = checkLicenses(items)

for (const f of findings) console.error(`  ${f.class.toUpperCase()} ${f.name} — ${f.license}`)
console.log(`license-check: ${s.allowed} allowed, ${s.review} review, ${s.denied} denied (${s.total} deps)`)
if (!s.passesGate) {
  console.error("✗ license-check: DENIED license(s) present — requires legal sign-off")
  process.exit(1)
}
console.log("✓ license-check: no denied licenses")
