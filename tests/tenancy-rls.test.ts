import { test } from "node:test"
import assert from "node:assert/strict"
import { tenantGucValue, setTenantSubtreeSql, tenantContextFor, applyTenantContext } from "@/lib/tenancy/rls"
import { visibleTenantIds, SCOPE_TENANTS } from "@/lib/access/scope"

test("tenantGucValue joins, dedupes and sanitises tenant ids", () => {
  assert.equal(tenantGucValue(["TN", "TN-CHN", "TN"]), "TN,TN-CHN")
  assert.equal(tenantGucValue([]), "")
  // injection characters are stripped (defense-in-depth alongside parameterisation)
  assert.equal(tenantGucValue(["TN'; DROP TABLE x;--"]), "TNDROPTABLEx--")
})

test("setTenantSubtreeSql emits a transaction-scoped SET LOCAL", () => {
  assert.equal(setTenantSubtreeSql(["TN-CHN"]), "SET LOCAL app.tenant_ids = 'TN-CHN'")
  assert.equal(setTenantSubtreeSql([]), "SET LOCAL app.tenant_ids = ''")
})

test("the GUC mirrors the app-layer scope subtree (defense-in-depth parity)", () => {
  // The RLS set must equal what lib/access/scope grants the same subject.
  const ids = visibleTenantIds(SCOPE_TENANTS, "TN-CHN")
  const guc = tenantGucValue(ids)
  assert.ok(guc.includes("TN-CHN"))
  assert.ok(guc.includes("TN-CHN-B1-S1"))
  assert.ok(!guc.split(",").includes("TN")) // not its ancestor
  assert.ok(!guc.split(",").includes("TN-CBE")) // not a sibling district
})

test("tenantContextFor resolves a role to its governed subtree; out-of-hierarchy => empty", () => {
  const deo = tenantContextFor("DEO").split(",")
  assert.ok(deo.includes("TN-CHN"))
  assert.ok(deo.includes("TN-CHN-B1-S1"))
  assert.equal(tenantContextFor("PRINCIPAL"), "TN-CHN-B1-S1") // single school
  assert.equal(tenantContextFor("VENDOR"), "") // governs nothing → RLS admits nothing
  assert.equal(tenantContextFor(null), "")
})

test("applyTenantContext calls the set_tenant_context RPC with the role's GUC", async () => {
  let fn = ""
  let passed: Record<string, unknown> = {}
  const db = { rpc: async (f: string, a: Record<string, unknown>) => { fn = f; passed = a; return null } }
  const applied = await applyTenantContext(db, "BEO")
  assert.equal(fn, "set_tenant_context")
  assert.equal(passed.ids, applied)
  assert.ok(String(passed.ids).includes("TN-CHN-B1")) // the block subtree
})

test("applyTenantContext is fail-closed if the RPC is unavailable (no throw)", async () => {
  const db = { rpc: async () => { throw new Error("function does not exist") } }
  const applied = await applyTenantContext(db, "DEO")
  assert.ok(applied.length > 0) // still returns the intended GUC; context simply not set
})
