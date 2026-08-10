import { readFileSync } from "node:fs"
import { join } from "node:path"
import { test } from "node:test"
import assert from "node:assert/strict"
import { genericAtomicCommitRpc, AtomicOutboxRpcError } from "@/lib/events/atomic-rpc"
import { loadManifest } from "@/scripts/migrations/run"

const sql = readFileSync(join(process.cwd(), "lib/events/rpc/generic_atomic.sql"), "utf8")

test("generic atomic RPC is a single DB-side function that inserts domain rows and outbox events", () => {
  assert.match(sql, /create or replace function public\.platform_generic_atomic_commit/i)
  assert.match(sql, /insert into public\.platform_outbox/i)
  assert.match(sql, /jsonb_populate_record/i)
  assert.match(sql, /on conflict \(idempotency_key\) do nothing/i)
  assert.match(sql, /returns jsonb/i)
})

test("generic atomic RPC validates tenant context and event identity", () => {
  assert.match(sql, /p_tenant_context jsonb/i)
  assert.match(sql, /jsonb_build_object\('tenant_id'/i)
  assert.match(sql, /outbox event is missing aggregate\/event identity/i)
})

test("generic atomic migration is wired into the migration manifest", () => {
  const manifest = loadManifest()
  assert.ok(manifest.migrations.some((migration) => migration.id === "004a_rpc_generic_atomic" && migration.path === "lib/events/rpc/generic_atomic.sql"))
})

test("generic atomic RPC wrapper fails closed without a Supabase admin client", async () => {
  await assert.rejects(
    () => genericAtomicCommitRpc("example", { id: "1" }, [], { tenantId: "tenant-1" }),
    (error) => error instanceof AtomicOutboxRpcError && /not configured/.test(error.message),
  )
})
