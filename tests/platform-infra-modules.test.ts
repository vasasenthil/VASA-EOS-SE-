import { test } from "node:test"
import assert from "node:assert/strict"
import { createEventBus } from "@/lib/event-bus"
import { authorizeGatewayRequest, CORE_GATEWAY_ROUTES } from "@/lib/api-gateway"
import { decryptJson, encryptJson, safeDigestEqual, sha256Hex } from "@/lib/encryption"

test("event bus publishes, notifies subscribers, and replays by topic", async () => {
  const bus = createEventBus(() => "2026-07-16T00:00:00.000Z")
  const seen: string[] = []
  const unsubscribe = bus.subscribe("workflow.case", (event) => { seen.push(event.id) })
  const event = await bus.publish({ topic: "workflow.case", type: "created", payload: { id: "WF-1" } })

  assert.equal(event.id, "evt-workflow-case-created-000001")
  assert.deepEqual(seen, [event.id])
  assert.equal(bus.replay("workflow.case").length, 1)

  unsubscribe()
  await bus.publish({ topic: "workflow.case", type: "approved", payload: { id: "WF-1" } })
  assert.deepEqual(seen, [event.id])
  assert.equal(bus.replay().length, 2)
})

test("API gateway authorizes known routes by method, path and role", () => {
  const ok = authorizeGatewayRequest(CORE_GATEWAY_ROUTES, { method: "GET", path: "/workflows/stakeholders", role: "SECRETARY", subjectId: "sec-1" })
  assert.equal(ok.ok, true)
  assert.equal(ok.target, "app/workflows/stakeholders/page.tsx")
  assert.equal(ok.rateLimitKey, "sec-1:workflow-matrix")

  const denied = authorizeGatewayRequest(CORE_GATEWAY_ROUTES, { method: "GET", path: "/workflows/stakeholders", role: "PUBLIC" })
  assert.equal(denied.ok, false)
  assert.match(denied.reason ?? "", /not allowed/)
})

test("encryption helper round-trips JSON and detects digest equality safely", () => {
  const iv = Buffer.from("000102030405060708090a0b", "hex")
  const envelope = encryptJson({ apaar: "123456789012", purpose: "test" }, "state-secret", iv)
  assert.equal(envelope.alg, "AES-256-GCM")
  assert.equal(/123456789012/.test(envelope.ciphertext), false)
  assert.deepEqual(decryptJson(envelope, "state-secret"), { apaar: "123456789012", purpose: "test" })

  const digest = sha256Hex("payload")
  assert.equal(safeDigestEqual(digest, sha256Hex("payload")), true)
  assert.equal(safeDigestEqual(digest, sha256Hex("other")), false)
})
