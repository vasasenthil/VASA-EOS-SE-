import { test } from "node:test"
import assert from "node:assert/strict"
import { buildEnvReport, ENV_CONTRACT } from "@/lib/env"

test("contract declares the supabase essentials", () => {
  const names = ENV_CONTRACT.map((d) => d.name)
  assert.ok(names.includes("NEXT_PUBLIC_SUPABASE_URL"))
  assert.ok(names.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY"))
})

test("missing required vars are reported and ok=false", () => {
  const r = buildEnvReport({})
  assert.equal(r.ok, false)
  assert.ok(r.missingRequired.includes("NEXT_PUBLIC_SUPABASE_URL"))
  assert.equal(r.mode, "demo")
})

test("all required present + service role => production mode, ok", () => {
  const r = buildEnvReport({
    NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    SUPABASE_SERVICE_ROLE_KEY: "svc",
  })
  assert.equal(r.ok, true)
  assert.equal(r.missingRequired.length, 0)
  assert.equal(r.mode, "production")
})

test("required present without service role => demo mode but ok", () => {
  const r = buildEnvReport({
    NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  })
  assert.equal(r.ok, true)
  assert.equal(r.mode, "demo")
})
