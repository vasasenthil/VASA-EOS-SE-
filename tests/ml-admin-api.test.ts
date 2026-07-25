import assert from "node:assert/strict"
import { test } from "node:test"
import { NextRequest } from "next/server"

function mlAdminRequest(path: string, body: unknown, roles: string[] = ["ML_ADMIN"]) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: "ml-admin-test-user",
      email: "ml-admin@vasa-eos.tn.gov.in",
      app_metadata: { roles },
    }),
  ).toString("base64url")

  return new NextRequest(`https://vasa-eos.tn.gov.in${path}`, {
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
    mlAdminRequest("/api/ml/models/dropout-risk/promote", { version: "v2" }),
    context,
  )
  assert.equal(incomplete.status, 400)

  const spoofed = await route.POST(
    mlAdminRequest("/api/ml/models/dropout-risk/promote", {
      version: "v2",
      approvalReason: "Approved after documented fairness review",
      promotedBy: "secretary@vasa-eos.tn.gov.in",
    }),
    context,
  )
  assert.equal(spoofed.status, 400)
})

test("model rollback requires a documented reason and a valid model type", async () => {
  const route = await import("@/app/api/ml/models/[type]/rollback/route")

  const missingReason = await route.POST(
    mlAdminRequest("/api/ml/models/dropout-risk/rollback", {}),
    { params: Promise.resolve({ type: "dropout-risk" }) },
  )
  assert.equal(missingReason.status, 400)

  const invalidType = await route.POST(
    mlAdminRequest("/api/ml/models/unknown/rollback", {
      rollbackReason: "Critical production drift threshold exceeded",
    }),
    { params: Promise.resolve({ type: "unknown" }) },
  )
  assert.equal(invalidType.status, 400)
})

test("model lifecycle mutations require ML administration roles", async () => {
  const route = await import("@/app/api/ml/models/[type]/promote/route")
  const response = await route.POST(
    mlAdminRequest(
      "/api/ml/models/dropout-risk/promote",
      { version: "v2", approvalReason: "Approved after documented fairness review" },
      ["TEACHER"],
    ),
    { params: Promise.resolve({ type: "dropout-risk" }) },
  )

  assert.equal(response.status, 403)
})
