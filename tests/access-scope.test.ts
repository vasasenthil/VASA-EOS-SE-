import { test } from "node:test"
import assert from "node:assert/strict"
import {
  SCOPE_TENANTS,
  SCOPE_RECORDS,
  inJurisdiction,
  scopeRecords,
  visibleTenantIds,
  jurisdictionLabel,
  nodeForRole,
  scopeBreakdown,
  ROLE_NODE,
} from "@/lib/access/scope"

test("inJurisdiction: self and descendants only (downward governance)", () => {
  // State governs a leaf school.
  assert.equal(inJurisdiction(SCOPE_TENANTS, "TN", "TN-CHN-B1-S1"), true)
  // A school does NOT govern its district (no upward access).
  assert.equal(inJurisdiction(SCOPE_TENANTS, "TN-CHN-B1-S1", "TN-CHN"), false)
  // Self.
  assert.equal(inJurisdiction(SCOPE_TENANTS, "TN-CHN", "TN-CHN"), true)
  // No sideways access: Chennai cannot see a Coimbatore school.
  assert.equal(inJurisdiction(SCOPE_TENANTS, "TN-CHN", "TN-CBE-B1-S1"), false)
})

test("scopeRecords narrows the dataset by jurisdiction", () => {
  assert.equal(scopeRecords(SCOPE_TENANTS, "TN", SCOPE_RECORDS).length, 4) // state sees all
  assert.equal(scopeRecords(SCOPE_TENANTS, "TN-CHN", SCOPE_RECORDS).length, 3) // Chennai district
  assert.equal(scopeRecords(SCOPE_TENANTS, "TN-CHN-B1", SCOPE_RECORDS).length, 2) // Egmore block
  assert.equal(scopeRecords(SCOPE_TENANTS, "TN-CHN-B1-S1", SCOPE_RECORDS).length, 1) // one school
  assert.equal(scopeRecords(SCOPE_TENANTS, "TN-CBE", SCOPE_RECORDS).length, 1) // Coimbatore
})

test("visibleTenantIds returns the governed subtree", () => {
  const chennai = visibleTenantIds(SCOPE_TENANTS, "TN-CHN")
  assert.ok(chennai.includes("TN-CHN"))
  assert.ok(chennai.includes("TN-CHN-B1-S1"))
  assert.ok(!chennai.includes("TN")) // not its ancestor
  assert.ok(!chennai.includes("TN-CBE")) // not a sibling
  // The whole tree from the root.
  assert.equal(visibleTenantIds(SCOPE_TENANTS, "TN").length, SCOPE_TENANTS.length)
})

test("nodeForRole maps roles to anchors; unknown/out-of-hierarchy → undefined", () => {
  assert.equal(nodeForRole("DEO"), "TN-CHN")
  assert.equal(nodeForRole("PRINCIPAL"), "TN-CHN-B1-S1")
  assert.equal(nodeForRole("MINISTER"), "TN")
  assert.equal(nodeForRole("VENDOR"), undefined)
  assert.equal(nodeForRole(null), undefined)
})

// SECURITY: the production fail-closed subject (resolveSubject → fallbackSubject(true))
// has roles=[], so the scope anchor is nodeForRole(roles[0]) = nodeForRole(undefined).
// scopeForCurrentSubject() returns [] when the anchor is undefined — verify no data leaks.
test("an anonymous, role-less subject resolves to no scope anchor (empty scope)", () => {
  const anonymousRoles: string[] = []
  assert.equal(nodeForRole(anonymousRoles[0]), undefined) // roles[0] is undefined
  assert.equal(nodeForRole(undefined), undefined)
  assert.equal(nodeForRole(""), undefined)
  // With no anchor, the jurisdiction-scoped dataset is empty (matches scopeForCurrentSubject's
  // `if (!node) return []`): there is no node whose subtree could include any record.
  assert.equal(scopeRecords(SCOPE_TENANTS, "", SCOPE_RECORDS).length, 0)
})

test("jurisdictionLabel describes the node and governed count", () => {
  assert.match(jurisdictionLabel(SCOPE_TENANTS, "TN-CHN-B1-S1"), /GHSS Egmore — governs 1 node/)
  assert.match(jurisdictionLabel(SCOPE_TENANTS, "TN-CHN-B1"), /Egmore Block — governs 3 nodes/)
  assert.equal(jurisdictionLabel(SCOPE_TENANTS, "nope"), "No jurisdiction")
})

test("scopeBreakdown ranks roles by visibility; state roles see everything", () => {
  const m = scopeBreakdown()
  assert.equal(m.length, Object.keys(ROLE_NODE).length)
  // The widest scope is first and equals all records.
  assert.equal(m[0].visibleRecords, SCOPE_RECORDS.length)
  // A Principal is at the narrow end with exactly one record.
  const principal = m.find((r) => r.role === "PRINCIPAL")
  assert.equal(principal?.visibleRecords, 1)
})
