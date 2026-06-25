import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { complianceDomains, complianceIndexSummary, toCSV } from "@/lib/compliance"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

/** Map an app route to its page file (route groups like (dashboards) are not used here). */
function pageFileFor(route: string): string {
  return join(repoRoot, "app", route.replace(/^\//, ""), "page.tsx")
}

test("every domain names a register and a page that both exist on disk (self-verifying)", () => {
  for (const d of complianceDomains()) {
    assert.ok(existsSync(join(repoRoot, d.registerRef)), `${d.id} → missing register ${d.registerRef}`)
    assert.ok(existsSync(pageFileFor(d.route)), `${d.id} → missing page for ${d.route}`)
  }
})

test("domains are well-formed: unique ids, positive item counts, a headline", () => {
  const ids = new Set<string>()
  for (const d of complianceDomains()) {
    assert.ok(!ids.has(d.id), `duplicate ${d.id}`)
    ids.add(d.id)
    assert.ok(d.items > 0, `${d.id} should have evidence items`)
    assert.ok(d.name && d.pillar && d.headline)
  }
})

test("the index aggregates real numbers from the underlying registers", () => {
  const s = complianceIndexSummary()
  const domains = complianceDomains()
  assert.equal(s.domains, domains.length)
  assert.equal(s.evidenceItems, domains.reduce((n, d) => n + d.items, 0))
  assert.ok(s.domains >= 12) // architecture, NDEAR, threat, AI, DPIA, PII, assurance, RPwD, languages, channels, lineage, DR
  assert.ok(s.evidenceItems > s.domains) // each register carries multiple items
})

test("CSV has a header plus one row per domain", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Domain,Pillar,Items,Status,Register,Route")
  assert.equal(lines.length, complianceDomains().length + 1)
})
