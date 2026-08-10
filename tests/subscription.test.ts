import { test } from "node:test"
import assert from "node:assert/strict"
import { hasActiveSubscription } from "@/lib/subscription"

test("subscription check fails closed when no subscription source is configured", () => {
  assert.equal(hasActiveSubscription({}), false)
})

test("subscription status allows only active or trialing subscriptions", () => {
  assert.equal(hasActiveSubscription({ SUBSCRIPTION_STATUS: "active" }), true)
  assert.equal(hasActiveSubscription({ SUBSCRIPTION_STATUS: "trialing" }), true)
  assert.equal(hasActiveSubscription({ SUBSCRIPTION_STATUS: "past_due" }), false)
  assert.equal(hasActiveSubscription({ SUBSCRIPTION_STATUS: "canceled" }), false)
})

test("subscription flag is a fallback when status is absent", () => {
  assert.equal(hasActiveSubscription({ SUBSCRIPTION_ACTIVE: "true" }), true)
  assert.equal(hasActiveSubscription({ SUBSCRIPTION_ACTIVE: "1" }), true)
  assert.equal(hasActiveSubscription({ SUBSCRIPTION_ACTIVE: "false" }), false)
  assert.equal(hasActiveSubscription({ SUBSCRIPTION_ACTIVE: "expired" }), false)
})

test("subscription status takes precedence over a stale active flag", () => {
  assert.equal(hasActiveSubscription({ SUBSCRIPTION_STATUS: "canceled", SUBSCRIPTION_ACTIVE: "true" }), false)
})
