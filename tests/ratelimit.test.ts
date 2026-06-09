import { test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { rateLimit, resetRateLimits, clientKey } from "@/lib/ratelimit"

beforeEach(() => resetRateLimits())

test("allows up to the limit, then blocks within the window", () => {
  const t0 = 1_000_000
  for (let i = 0; i < 3; i++) {
    const r = rateLimit("k", 3, 1000, t0)
    assert.equal(r.allowed, true)
    assert.equal(r.remaining, 2 - i)
  }
  const blocked = rateLimit("k", 3, 1000, t0)
  assert.equal(blocked.allowed, false)
  assert.equal(blocked.remaining, 0)
})

test("window resets after windowMs", () => {
  const t0 = 2_000_000
  rateLimit("w", 1, 1000, t0)
  assert.equal(rateLimit("w", 1, 1000, t0 + 500).allowed, false) // same window
  assert.equal(rateLimit("w", 1, 1000, t0 + 1500).allowed, true) // new window
})

test("keys are independent", () => {
  assert.equal(rateLimit("a", 1, 1000, 5).allowed, true)
  assert.equal(rateLimit("b", 1, 1000, 5).allowed, true)
})

test("clientKey reads forwarded headers with a fallback", () => {
  assert.equal(clientKey(new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" })), "1.2.3.4")
  assert.equal(clientKey(new Headers({ "x-real-ip": "9.9.9.9" })), "9.9.9.9")
  assert.equal(clientKey(new Headers()), "anon")
})
