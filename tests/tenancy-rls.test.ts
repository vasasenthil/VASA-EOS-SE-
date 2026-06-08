import { test } from "node:test"
import assert from "node:assert/strict"
import { tenantGucValue, setTenantSubtreeSql } from "@/lib/tenancy/rls"
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
