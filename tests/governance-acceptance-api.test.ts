import { test } from "node:test"
import assert from "node:assert/strict"
import { NextRequest } from "next/server"

function governanceRequest(roles: string[] = ["ADMIN"]) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: "governance-test-user",
      email: "ciso@vasa-eos.tn.gov.in",
      app_metadata: { roles },
    }),
  ).toString("base64url")
  return new NextRequest("https://vasa-eos.tn.gov.in/api/governance/acceptance-pack", {
    headers: { authorization: `Bearer test.${payload}.signature` },
  })
}

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

  const jsonResponse = await jsonRoute.GET(governanceRequest())
  assert.equal(jsonResponse.status, 200)
  const pack = await jsonResponse.json()
  assert.ok(pack.sections.some((section: { id: string }) => section.id === "inventory-ledger"))
  assert.ok(pack.sections.some((section: { id: string }) => section.id === "cutover-gate"))
  assert.ok(Array.isArray(pack.cutover.gates))

  const markdownResponse = await markdownRoute.GET(governanceRequest(["SECRETARY"]))
  assert.equal(markdownResponse.status, 200)
  assert.match(markdownResponse.headers.get("content-type") ?? "", /text\/markdown/)
  assert.match(markdownResponse.headers.get("content-disposition") ?? "", /production-acceptance-pack\.md/)
  const markdown = await markdownResponse.text()
  assert.match(markdown, /# Production Acceptance Pack/)
  assert.match(markdown, /## Cutover gates/)
  assert.match(markdown, /## Critical inventory sample/)
})


test("production acceptance manifest publishes SHA-256 custody evidence for every export", async () => {
  const manifestRoute = await import("@/app/api/governance/acceptance-pack/manifest/route")
  const response = await manifestRoute.GET(governanceRequest(["DIRECTOR"]))
  assert.equal(response.status, 200)
  assert.match(response.headers.get("cache-control") ?? "", /no-store/)
  const manifest = await response.json()
  assert.equal(manifest.algorithm, "sha256")
  assert.equal(manifest.custodyOwner, "CISO Office")
  assert.equal(manifest.retentionClass, "sovereign-production-acceptance")
  assert.deepEqual(
    manifest.artifacts.map((artifact: { id: string }) => artifact.id).sort(),
    ["acceptance-pack-json", "acceptance-pack-markdown", "inventory-ledger-csv", "inventory-ledger-json"],
  )
  for (const artifact of manifest.artifacts as Array<{ sha256: string; bytes: number; path: string }>) {
    assert.match(artifact.sha256, /^[a-f0-9]{64}$/)
    assert.ok(artifact.bytes > 0)
    assert.match(artifact.path, /^\/api\/governance\//)
  }
})


test("production acceptance exports require governance roles", async () => {
  const jsonRoute = await import("@/app/api/governance/acceptance-pack/route")

  const anonymous = await jsonRoute.GET(new NextRequest("https://vasa-eos.tn.gov.in/api/governance/acceptance-pack"))
  assert.equal(anonymous.status, 401)

  const teacher = await jsonRoute.GET(governanceRequest(["TEACHER"]))
  assert.equal(teacher.status, 403)
})
