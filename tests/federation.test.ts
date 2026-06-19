import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { FEDERATION_SOURCES, federationSource, validateLog, logSummary, queryLogs, type FederationLog, type LogInput } from "@/lib/federation"
import { listLogs, getLog, createLog, updateLog, deleteLog, seedLogs } from "@/lib/federation/store"

test("FEDERATION_SOURCES covers APAAR/UDISE/DIKSHA/PFMS", () => {
  const keys = FEDERATION_SOURCES.map((s) => s.key)
  assert.deepEqual(keys, ["apaar", "udise", "diksha", "pfms"])
  assert.equal(federationSource("apaar")?.label, "APAAR (Learner ID)")
  assert.equal(federationSource("nope"), undefined)
})

function valid(over: Partial<LogInput> = {}): LogInput {
  return { source: "apaar", sourceLabel: "APAAR (Learner ID)", key: "APAAR-100200300401", summary: "Aarthi M.", mode: "mock", status: "Pending", reconciledBy: "", notes: "", ...over }
}

test("validateLog: source + key required; reconciler required to decide", () => {
  assert.equal(validateLog(valid()).ok, true)
  assert.ok(validateLog(valid({ source: "nope" })).errors.source)
  assert.ok(validateLog(valid({ key: "" })).errors.key)
  assert.ok(validateLog(valid({ status: "Reconciled", reconciledBy: "" })).errors.reconciledBy)
  assert.equal(validateLog(valid({ status: "Reconciled", reconciledBy: "BEO" })).ok, true)
})

function log(over: Partial<FederationLog>): FederationLog {
  return { ...valid(), id: "l", createdAt: "2026-06-01", updatedAt: "", ...over } as FederationLog
}

test("logSummary + queryLogs (status filter, Pending first)", () => {
  const all = [log({ id: "a", status: "Reconciled" }), log({ id: "b", status: "Pending" }), log({ id: "c", status: "Flagged" })]
  const s = logSummary(all)
  assert.equal(s.total, 3)
  assert.equal(s.pending, 1)
  assert.equal(s.flagged, 1)
  assert.equal(queryLogs(all).logs[0].status, "Pending") // pending first
  assert.ok(queryLogs(all, { status: "Flagged" }).logs.every((l) => l.status === "Flagged"))
  assert.ok(queryLogs(all, { source: "apaar" }).logs.every((l) => l.source === "apaar"))
})

test("store CRUD: create → read → reconcile → delete (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createLog(valid())
  assert.match(created.id, /^FED-/)
  assert.equal((await getLog(created.id))?.source, "apaar")
  const reconciled = await updateLog(created.id, valid({ status: "Reconciled", reconciledBy: "BEO" }))
  assert.equal(reconciled?.status, "Reconciled")
  assert.equal(await deleteLog(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback seeded with the federated systems; seedLogs idempotent", async () => {
  __setTestDb(null)
  const before = await listLogs()
  assert.ok(before.length >= 3)
  assert.equal(await seedLogs(), 3)
  assert.equal((await listLogs()).length, before.length)
  // the seed touches each major federation source
  const sources = new Set(before.map((l) => l.source))
  assert.ok(sources.has("apaar") && sources.has("udise") && sources.has("pfms"))
})
