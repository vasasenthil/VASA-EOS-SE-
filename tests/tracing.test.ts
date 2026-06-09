import { test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { startSpan, endSpan, withSpan, getSpans, resetSpans, traceSummary, formatOtlp } from "@/lib/tracing"

beforeEach(() => resetSpans())

test("startSpan/endSpan record a span with duration and ids", () => {
  const s = startSpan("op", { now: 1000, attributes: { k: "v" } })
  assert.equal(s.traceId.length, 32) // 16 bytes hex
  assert.equal(s.spanId.length, 16)
  const done = endSpan(s, "ok", 1250)
  assert.equal(done.durationMs, 250)
  assert.equal(getSpans().length, 1)
})

test("child span inherits the parent trace id", () => {
  const parent = startSpan("parent")
  const child = startSpan("child", { parent })
  assert.equal(child.traceId, parent.traceId)
  assert.equal(child.parentId, parent.spanId)
})

test("withSpan records ok on success and re-raises+marks error on throw", async () => {
  const v = await withSpan("ok-op", async () => 42)
  assert.equal(v, 42)
  await assert.rejects(withSpan("bad-op", async () => { throw new Error("boom") }))
  const spans = getSpans()
  assert.equal(spans.find((s) => s.name === "ok-op")?.status, "ok")
  const bad = spans.find((s) => s.name === "bad-op")
  assert.equal(bad?.status, "error")
  assert.match(String(bad?.attributes.error), /boom/)
})

test("traceSummary counts spans, errors and average duration", () => {
  endSpan(startSpan("a", { now: 0 }), "ok", 100)
  endSpan(startSpan("b", { now: 0 }), "error", 300)
  const s = traceSummary()
  assert.equal(s.spans, 2)
  assert.equal(s.errors, 1)
  assert.equal(s.avgMs, 200)
})

test("formatOtlp emits valid OTLP/JSON resourceSpans", () => {
  endSpan(startSpan("x", { now: 1, attributes: { n: 3, flag: true } }), "ok", 5)
  const otlp = JSON.parse(formatOtlp(getSpans()))
  const span = otlp.resourceSpans[0].scopeSpans[0].spans[0]
  assert.equal(span.name, "x")
  assert.equal(span.status.code, 1)
  assert.equal(span.startTimeUnixNano, 1_000_000)
  assert.ok(otlp.resourceSpans[0].resource.attributes.some((a: { value: { stringValue?: string } }) => a.value.stringValue === "vasa-eos-se"))
})
