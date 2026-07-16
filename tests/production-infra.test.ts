import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { NextRequest } from "next/server"
import { requireRole } from "@/lib/auth/require-role"
import { sessionFromJwt } from "@/lib/auth/session"
import { moveToDeadLetter, listDeadLetters, retryDeadLetter, discardDeadLetter, resetDeadLettersForTests } from "@/lib/events/dead-letters"
import type { OutboxEventRecord } from "@/lib/events/outbox-publisher"
import { outboxEventsPending, outboxEventsProcessed, renderPrometheusMetrics, resetMetricsForTests } from "@/lib/observability/metrics"
import { recordWorkerHeartbeat, getWorkerHealth, resetWorkerHealthForTests } from "@/lib/observability/health"
import { loadManifest, validateManifest } from "../scripts/migrations/run"

function jwt(payload: Record<string, unknown>): string {
  const enc = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url")
  return `${enc({ alg: "none" })}.${enc(payload)}.`
}

test("atomic outbox RPC migrations insert domain rows and platform_outbox events", () => {
  for (const file of ["insert_with_outbox", "scholarship_file_with_outbox", "tc_file_with_outbox", "scheme_propose_with_outbox"]) {
    const sql = readFileSync(`lib/events/rpc/${file}.sql`, "utf8")
    assert.match(sql, /create or replace function public\./i)
    assert.match(sql, /platform_outbox/i)
    assert.match(sql, /raise exception/i)
  }
})

test("migration manifest is ordered and points to existing files", () => {
  const manifest = loadManifest()
  assert.doesNotThrow(() => validateManifest(manifest))
  assert.equal(manifest.migrations[0].id, "001_outbox_schema")
  assert.ok(manifest.migrations.some((migration) => migration.path.includes("workflow-schema.sql")))
})

test("session role middleware rejects missing and wrong roles and accepts JWT roles", async () => {
  const denied = await requireRole(new NextRequest("https://example.test/api/schemes", { method: "POST" }), ["SECRETARY"])
  assert.equal(denied.ok, false)
  if (!denied.ok) assert.equal(denied.response.status, 401)

  const wrong = await requireRole(new NextRequest("https://example.test/api/schemes", { headers: { authorization: `Bearer ${jwt({ sub: "u1", app_metadata: { roles: ["TEACHER"] } })}` } }), ["SECRETARY"])
  assert.equal(wrong.ok, false)
  if (!wrong.ok) assert.equal(wrong.response.status, 403)

  const allowed = await requireRole(new NextRequest("https://example.test/api/schemes", { headers: { authorization: `Bearer ${jwt({ sub: "u2", app_metadata: { roles: ["SECRETARY"] } })}` } }), ["SECRETARY"])
  assert.equal(allowed.ok, true)
})

test("JWT session extraction maps tenant metadata", () => {
  const session = sessionFromJwt(jwt({ sub: "u3", email: "u3@example.test", app_metadata: { roles: ["ADMIN"], district_id: "d1" } }))
  assert.equal(session?.roles[0], "ADMIN")
  assert.equal(session?.tenant.districtId, "d1")
})

test("dead letters can be listed, retried, and discarded", async () => {
  resetDeadLettersForTests()
  const base = { id: "e1", aggregate_type: "scheme", aggregate_id: "s1", event_type: "SchemeProposed", payload: { schemeId: "s1" }, status: "failed", created_at: new Date().toISOString(), processed_at: null, retry_count: 5, idempotency_key: "k1", last_error: "boom", locked_at: null, locked_by: null, event: {} as any } satisfies OutboxEventRecord
  const first = await moveToDeadLetter(base, "boom")
  const second = await moveToDeadLetter({ ...base, id: "e2", idempotency_key: "k2" }, "poison")
  assert.equal((await listDeadLetters({ status: "open" })).length, 2)
  assert.match(await retryDeadLetter(first.id), /^[0-9a-f-]{36}$/i)
  await discardDeadLetter(second.id)
  assert.equal((await listDeadLetters({ status: "open" })).length, 0)
})

test("observability metrics and worker health render production signals", () => {
  resetMetricsForTests(); resetWorkerHealthForTests()
  outboxEventsPending(7); outboxEventsProcessed(3); recordWorkerHeartbeat("outbox-dispatcher")
  const metrics = renderPrometheusMetrics()
  assert.match(metrics, /outbox_events_pending 7/)
  assert.match(metrics, /outbox_events_processed_total 3/)
  assert.equal(getWorkerHealth("outbox-dispatcher").status, "running")
})
