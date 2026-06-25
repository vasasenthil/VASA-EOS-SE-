import { test } from "node:test"
import assert from "node:assert/strict"
import { buildReadiness, type ReadinessInput } from "@/lib/readiness"

const base: ReadinessInput = {
  dbReady: true,
  envOk: true,
  mode: "production",
  missingRequired: [],
  version: "abc1234",
  uptimeSec: 12.7,
}

const at = () => "2026-06-06T00:00:00.000Z"

test("ready when configured and durable persistence is available", () => {
  const r = buildReadiness(base, at)
  assert.equal(r.status, "ready")
  assert.equal(r.durablePersistence, true)
  assert.equal(r.uptimeSec, 13) // rounded
  assert.equal(r.checkedAt, "2026-06-06T00:00:00.000Z")
})

test("degraded when configured but persistence is in-memory", () => {
  const r = buildReadiness({ ...base, dbReady: false, mode: "demo" }, at)
  assert.equal(r.status, "degraded")
  assert.equal(r.durablePersistence, false)
})

test("unavailable when required config is missing", () => {
  const r = buildReadiness({ ...base, envOk: false, missingRequired: ["NEXT_PUBLIC_SUPABASE_URL"] }, at)
  assert.equal(r.status, "unavailable")
  assert.deepEqual(r.missingRequired, ["NEXT_PUBLIC_SUPABASE_URL"])
})
