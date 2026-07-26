import assert from "node:assert/strict"
import { test } from "node:test"
import { NextRequest } from "next/server"

function mlRequest(path: string, options: { body?: unknown; roles?: string[] } = {}) {
  const { body, roles = ["ML_ADMIN"] } = options
  const payload = Buffer.from(
    JSON.stringify({
      sub: "ml-admin-test-user",
      email: "ml-admin@vasa-eos.tn.gov.in",
      app_metadata: { roles },
    }),
  ).toString("base64url")

  return new NextRequest(`https://vasa-eos.tn.gov.in${path}`, body === undefined ? {
    headers: { authorization: `Bearer test.${payload}.signature` },
  } : {
    method: "POST",
    headers: {
      authorization: `Bearer test.${payload}.signature`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  })
}

test("model promotion rejects malformed, incomplete, and actor-spoofing requests", async () => {
  const route = await import("@/app/api/ml/models/[type]/promote/route")
  const context = { params: Promise.resolve({ type: "dropout-risk" }) }

  const incomplete = await route.POST(
    mlRequest("/api/ml/models/dropout-risk/promote", { body: { version: "v2" } }),
    context,
  )
  assert.equal(incomplete.status, 400)

  const spoofed = await route.POST(
    mlRequest("/api/ml/models/dropout-risk/promote", { body: {
      version: "v2",
      approvalReason: "Approved after documented fairness review",
      promotedBy: "secretary@vasa-eos.tn.gov.in",
    } }),
    context,
  )
  assert.equal(spoofed.status, 400)
})

test("model rollback requires a documented reason and a valid model type", async () => {
  const route = await import("@/app/api/ml/models/[type]/rollback/route")

  const missingReason = await route.POST(
    mlRequest("/api/ml/models/dropout-risk/rollback", { body: {} }),
    { params: Promise.resolve({ type: "dropout-risk" }) },
  )
  assert.equal(missingReason.status, 400)

  const invalidType = await route.POST(
    mlRequest("/api/ml/models/unknown/rollback", { body: {
      rollbackReason: "Critical production drift threshold exceeded",
    } }),
    { params: Promise.resolve({ type: "unknown" }) },
  )
  assert.equal(invalidType.status, 400)
})

test("model lifecycle mutations require ML administration roles", async () => {
  const route = await import("@/app/api/ml/models/[type]/promote/route")
  const response = await route.POST(
    mlRequest(
      "/api/ml/models/dropout-risk/promote",
      {
        body: { version: "v2", approvalReason: "Approved after documented fairness review" },
        roles: ["TEACHER"],
      },
    ),
    { params: Promise.resolve({ type: "dropout-risk" }) },
  )

  assert.equal(response.status, 403)
})

test("prediction records are restricted to ML administrators", async () => {
  const route = await import("@/app/api/ml/route")

  const director = await route.GET(mlRequest("/api/ml?view=predictions", { roles: ["DIRECTOR"] }))
  assert.equal(director.status, 403)

  const unsupported = await route.GET(mlRequest("/api/ml?view=raw-features"))
  assert.equal(unsupported.status, 400)
})

test("active model lookup rejects unknown model types without throwing", async () => {
  const route = await import("@/app/api/ml/models/[type]/route")
  const response = await route.GET(
    mlRequest("/api/ml/models/unknown"),
    { params: Promise.resolve({ type: "unknown" }) },
  )

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: "Invalid model type" })
})
