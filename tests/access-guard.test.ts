import { test } from "node:test"
import assert from "node:assert/strict"
import { requireAccess, subjectForRoles, AccessDeniedError } from "@/lib/access/policy"

test("ADMIN (wildcard) may perform any action", () => {
  const admin = subjectForRoles(["ADMIN"], undefined, "u1")
  assert.doesNotThrow(() => requireAccess(admin, "approve:recognition"))
  assert.doesNotThrow(() => requireAccess(admin, "resolve:grievance"))
})

test("a STUDENT is denied a privileged approval action", () => {
  const student = subjectForRoles(["STUDENT"], undefined, "u2")
  assert.throws(() => requireAccess(student, "approve:recognition"), AccessDeniedError)
})

test("a BEO may resolve grievances (granted) but not approve recognition at will", () => {
  const beo = subjectForRoles(["BEO"], undefined, "u3")
  assert.doesNotThrow(() => requireAccess(beo, "resolve:grievance"))
})
