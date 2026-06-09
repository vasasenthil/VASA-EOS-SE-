import { test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { startSpan, endSpan, resetSpans, exportSpans } from "@/lib/tracing"
import { preflightProduction, preflightReport } from "@/lib/env"

beforeEach(() => resetSpans())

test("exportSpans is a no-op (skipped) when no endpoint is configured", async () => {
  endSpan(startSpan("op"))
  const r = await exportSpans(undefined, { endpoint: undefined })
  assert.equal(r.skipped, true)
  assert.equal(r.ok, true)
  assert.equal(r.exported, 0)
})

test("exportSpans POSTs OTLP to <endpoint>/v1/traces and reports count", async () => {
  endSpan(startSpan("a"))
  endSpan(startSpan("b"))
  let calledUrl = ""
  let body = ""
  const r = await exportSpans(undefined, {
    endpoint: "http://collector:4318",
    fetchImpl: async (url, init) => {
      calledUrl = url
      body = init.body
      return { ok: true, status: 200 }
    },
  })
  assert.equal(calledUrl, "http://collector:4318/v1/traces")
  assert.equal(r.ok, true)
  assert.equal(r.exported, 2)
  assert.match(body, /resourceSpans/)
})

test("exportSpans captures a transport error without throwing", async () => {
  endSpan(startSpan("a"))
  const r = await exportSpans(undefined, {
    endpoint: "http://collector:4318",
    fetchImpl: async () => { throw new Error("conn refused") },
  })
  assert.equal(r.ok, false)
  assert.match(r.error ?? "", /conn refused/)
})

test("preflight flags demo mode as a production blocker", () => {
  const issues = preflightProduction({}) // nothing set
  assert.ok(issues.some((i) => i.severity === "blocker" && /persistence/i.test(i.check)))
  assert.ok(issues.some((i) => /Authentication/i.test(i.check)))
})

test("preflight blocks a leftover demo password; otherwise ready", () => {
  const prod = {
    SUPABASE_SERVICE_ROLE_KEY: "x",
    NEXT_PUBLIC_SUPABASE_URL: "u",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "a",
    OTEL_EXPORTER_OTLP_ENDPOINT: "http://c:4318",
  }
  assert.equal(preflightReport(prod).ready, true)
  const withDemo = preflightReport({ ...prod, DEMO_PASSWORD: "secret" })
  assert.equal(withDemo.ready, false)
  assert.ok(withDemo.issues.some((i) => /demo/i.test(i.check)))
})
