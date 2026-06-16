import { test } from "node:test"
import assert from "node:assert/strict"
import { fallbackSubject } from "@/lib/access/resolve"
import { requireAccess, AccessDeniedError } from "@/lib/access/policy"

// SECURITY REGRESSION TEST — an unresolved request in production must never default
// to ADMIN. Before the fix, resolveSubject() fell back to DEMO_ROLE (default ADMIN)
// even when Supabase was configured, which authorised privileged server actions for
// unauthenticated callers.

test("production fallback (configured) is role-less and fails closed", () => {
  const s = fallbackSubject(true)
  assert.deepEqual(s.roles, [])
  // Any privileged action must be denied for this subject.
  assert.throws(() => requireAccess(s, "manage:governance"), AccessDeniedError)
  assert.throws(() => requireAccess(s, "manage:school"), AccessDeniedError)
})

test("demo fallback (not configured) keeps the credential-free walkthrough as ADMIN", () => {
  const prev = process.env.DEMO_ROLE
  delete process.env.DEMO_ROLE
  const s = fallbackSubject(false)
  assert.deepEqual(s.roles, ["ADMIN"])
  // ADMIN can act (wildcard grant) — demo unaffected.
  assert.doesNotThrow(() => requireAccess(s, "manage:governance"))
  if (prev !== undefined) process.env.DEMO_ROLE = prev
})

test("demo fallback honours DEMO_ROLE for testing enforcement as a lesser role", () => {
  const prev = process.env.DEMO_ROLE
  process.env.DEMO_ROLE = "PUBLIC"
  const s = fallbackSubject(false)
  assert.deepEqual(s.roles, ["PUBLIC"])
  if (prev === undefined) delete process.env.DEMO_ROLE
  else process.env.DEMO_ROLE = prev
})
