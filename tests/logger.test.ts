import { test } from "node:test"
import assert from "node:assert/strict"
import { formatLog, redact } from "@/lib/logger"

test("redact masks secret-looking fields, keeps the rest", () => {
  const out = redact({ userId: "u1", password: "p", service_role_key: "k", note: "ok" })
  assert.equal(out.userId, "u1")
  assert.equal(out.note, "ok")
  assert.equal(out.password, "[redacted]")
  assert.equal(out.service_role_key, "[redacted]")
})

test("formatLog emits parseable JSON with ts/level/message/fields", () => {
  const line = formatLog("info", "hello", { a: 1 }, () => "2026-06-06T00:00:00.000Z")
  const parsed = JSON.parse(line)
  assert.equal(parsed.level, "info")
  assert.equal(parsed.message, "hello")
  assert.equal(parsed.a, 1)
  assert.equal(parsed.ts, "2026-06-06T00:00:00.000Z")
})

test("formatLog redacts secrets in the serialised line", () => {
  const parsed = JSON.parse(formatLog("error", "auth", { token: "abc" }))
  assert.equal(parsed.token, "[redacted]")
})
