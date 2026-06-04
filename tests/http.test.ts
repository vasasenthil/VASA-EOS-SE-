import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { httpJson } from "@/lib/integrations/http"

const realFetch = globalThis.fetch

function mockFetch(impl: (url: string, init?: RequestInit) => Promise<unknown>) {
  globalThis.fetch = impl as unknown as typeof fetch
}

beforeEach(() => {
  globalThis.fetch = realFetch
})
afterEach(() => {
  globalThis.fetch = realFetch
})

test("returns ok with parsed data on 2xx", async () => {
  mockFetch(async () => ({ ok: true, status: 200, json: async () => ({ hello: "world" }) }))
  const r = await httpJson<{ hello: string }>("https://x.test/api")
  assert.equal(r.ok, true)
  assert.equal(r.data?.hello, "world")
  assert.ok(r.traceId)
})

test("captures a non-2xx as a typed error (never throws)", async () => {
  mockFetch(async () => ({ ok: false, status: 503, json: async () => ({}) }))
  const r = await httpJson("https://x.test/api")
  assert.equal(r.ok, false)
  assert.equal(r.status, 503)
  assert.match(r.error ?? "", /503/)
})

test("captures a network error message", async () => {
  mockFetch(async () => {
    throw new Error("boom")
  })
  const r = await httpJson("https://x.test/api")
  assert.equal(r.ok, false)
  assert.equal(r.error, "boom")
})

test("maps an abort to a timeout message", async () => {
  mockFetch(async () => {
    const e = new Error("aborted")
    e.name = "AbortError"
    throw e
  })
  const r = await httpJson("https://x.test/api", { timeoutMs: 5 })
  assert.equal(r.ok, false)
  assert.equal(r.error, "Upstream timed out")
})

test("maps a non-Error throw to a generic message", async () => {
  mockFetch(async () => {
    throw "weird-non-error"
  })
  const r = await httpJson("https://x.test/api")
  assert.equal(r.ok, false)
  assert.equal(r.error, "Unknown error")
})

test("sends JSON body and headers on POST", async () => {
  let capturedInit: RequestInit | undefined
  mockFetch(async (_url, init) => {
    capturedInit = init
    return { ok: true, status: 200, json: async () => ({}) }
  })
  await httpJson("https://x.test/api", { method: "POST", body: { a: 1 }, headers: { authorization: "Bearer k" } })
  assert.equal(capturedInit?.method, "POST")
  assert.equal(capturedInit?.body, JSON.stringify({ a: 1 }))
  const headers = capturedInit?.headers as Record<string, string>
  assert.equal(headers.authorization, "Bearer k")
})
