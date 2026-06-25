import { test } from "node:test"
import assert from "node:assert/strict"
import {
  MANAGED_SECRETS,
  ACTIVE_PROVIDER,
  getSecret,
  redact,
  secretsReport,
  missingRequired,
  secretsSummary,
} from "@/lib/secrets"

test("getSecret returns a value only when set and non-empty", () => {
  const env = { FOO: "abc123", EMPTY: "" }
  assert.equal(getSecret("FOO", env), "abc123")
  assert.equal(getSecret("EMPTY", env), undefined)
  assert.equal(getSecret("MISSING", env), undefined)
})

test("redact never reveals the full secret", () => {
  assert.equal(redact(undefined), "(unset)")
  assert.equal(redact("xy"), "****")
  assert.equal(redact("supersecretvalue9821"), "****9821")
  assert.ok(!redact("supersecretvalue9821").includes("supersecret"))
})

test("the report is presence-only and never includes values", () => {
  const env = { SUPABASE_SERVICE_ROLE_KEY: "live-key-xyz" }
  const report = secretsReport(env)
  const supa = report.find((s) => s.name === "SUPABASE_SERVICE_ROLE_KEY")!
  assert.equal(supa.present, true)
  // no value field exists on the status objects
  assert.deepEqual(Object.keys(supa).sort(), ["name", "present", "required"].sort())
  assert.ok(!JSON.stringify(report).includes("live-key-xyz"))
})

test("required secrets that are missing are reported (fail-closed input)", () => {
  const refs = [{ name: "MUST_HAVE", required: true, description: "x" }]
  assert.deepEqual(missingRequired({}, refs), ["MUST_HAVE"])
  assert.deepEqual(missingRequired({ MUST_HAVE: "set" }, refs), [])
})

test("summary tallies provider, managed count and presence", () => {
  const env = { INTEGRATION_APAAR_KEY: "k1", INTEGRATION_DBT_KEY: "k2" }
  const s = secretsSummary(env)
  assert.equal(s.provider, ACTIVE_PROVIDER)
  assert.equal(s.managed, MANAGED_SECRETS.length)
  assert.equal(s.present, 2)
  assert.equal(s.requiredMissing, 0) // none of the managed secrets are required today
})
