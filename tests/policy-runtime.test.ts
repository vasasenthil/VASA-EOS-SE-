import test from "node:test"
import assert from "node:assert/strict"
import { POLICY_DATABASE_REQUIRED, policyDataMode } from "@/lib/policy/runtime"
import { readFileSync } from "node:fs"

test("policy data mode never substitutes demo data in production", () => {
  assert.equal(policyDataMode({ databaseConfigured: false, nodeEnv: "production", demoEnabled: true }), "unavailable")
  assert.equal(policyDataMode({ databaseConfigured: true, nodeEnv: "production" }), "live")
})

test("demo policy data is limited to tests or explicit non-production walkthroughs", () => {
  assert.equal(policyDataMode({ databaseConfigured: false, nodeEnv: "test" }), "development-demo")
  assert.equal(policyDataMode({ databaseConfigured: false, nodeEnv: "development", demoEnabled: true }), "development-demo")
  assert.equal(policyDataMode({ databaseConfigured: false, nodeEnv: "development" }), "unavailable")
})

test("operator remediation requires a real PostgreSQL migration URI", () => {
  assert.match(POLICY_DATABASE_REQUIRED, /PostgreSQL migration URI/)
  const manifest = JSON.parse(readFileSync("migrations/manifest.json", "utf8")) as { migrations: { id: string }[] }
  assert.ok(manifest.migrations.some((entry) => entry.id === "012_policy_schema"))
  assert.ok(manifest.migrations.some((entry) => entry.id === "013_policy_baseline"))
})
