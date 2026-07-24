import { test } from "node:test"
import assert from "node:assert/strict"

test("governance inventory ledger JSON and CSV exports are machine-readable", async () => {
  const jsonRoute = await import("@/app/api/governance/inventory-ledger/route")
  const csvRoute = await import("@/app/api/governance/inventory-ledger/csv/route")

  const jsonResponse = await jsonRoute.GET()
  assert.equal(jsonResponse.status, 200)
  const ledger = await jsonResponse.json()
  assert.ok(ledger.readiness.total > 0)
  assert.ok(ledger.items.some((item: { path: string }) => item.path === "app/governance/acceptance-pack/page.tsx"))

  const csvResponse = await csvRoute.GET()
  assert.equal(csvResponse.status, 200)
  assert.match(csvResponse.headers.get("content-type") ?? "", /text\/csv/)
  assert.match(csvResponse.headers.get("content-disposition") ?? "", /governance-inventory-ledger\.csv/)
  const csv = await csvResponse.text()
  assert.match(csv, /^id,kind,path,status,owner,dataClassification,tenantScoped,notes/m)
  assert.match(csv, /app\/api\/governance\/inventory-ledger\/csv\/route\.ts/)
})

test("production acceptance pack JSON and Markdown exports include sections and cutover evidence", async () => {
  const jsonRoute = await import("@/app/api/governance/acceptance-pack/route")
  const markdownRoute = await import("@/app/api/governance/acceptance-pack/markdown/route")

  const jsonResponse = await jsonRoute.GET()
  assert.equal(jsonResponse.status, 200)
  const pack = await jsonResponse.json()
  assert.ok(pack.sections.some((section: { id: string }) => section.id === "inventory-ledger"))
  assert.ok(pack.sections.some((section: { id: string }) => section.id === "cutover-gate"))
  assert.ok(Array.isArray(pack.cutover.gates))

  const markdownResponse = await markdownRoute.GET()
  assert.equal(markdownResponse.status, 200)
  assert.match(markdownResponse.headers.get("content-type") ?? "", /text\/markdown/)
  assert.match(markdownResponse.headers.get("content-disposition") ?? "", /production-acceptance-pack\.md/)
  const markdown = await markdownResponse.text()
  assert.match(markdown, /# Production Acceptance Pack/)
  assert.match(markdown, /## Cutover gates/)
  assert.match(markdown, /## Critical inventory sample/)
})
