import { test } from "node:test"
import assert from "node:assert/strict"
import {
  can,
  canRole,
  subjectForRoles,
  requireAccess,
  AccessDeniedError,
  allActions,
} from "@/lib/access/policy"

test("ADMIN has the wildcard grant", () => {
  assert.equal(canRole("ADMIN", "manage:school"), true)
  assert.equal(canRole("ADMIN", "anything:at:all"), true)
})

test("role grants are scoped", () => {
  assert.equal(canRole("TEACHER", "write:attendance"), true)
  assert.equal(canRole("TEACHER", "read:state"), false)
  assert.equal(canRole("PUBLIC", "file:grievance"), true)
  assert.equal(canRole("PUBLIC", "manage:school"), false)
})

test("deny-wins: a suspended subject is denied even with a matching grant", () => {
  const d = can(subjectForRoles(["TEACHER"], { suspended: true }), "write:attendance")
  assert.equal(d.permitted, false)
  assert.match(d.reason, /policy/i)
})

test("PBAC: PUBLIC cannot read sensitive resources", () => {
  const d = can(subjectForRoles(["PUBLIC"]), "read:public", { type: "report", attributes: { sensitive: true } })
  assert.equal(d.permitted, false)
})

test("PBAC: RESEARCHER cannot read PII", () => {
  const d = can(subjectForRoles(["RESEARCHER"]), "read:anonymised", { type: "dataset", attributes: { pii: true } })
  assert.equal(d.permitted, false)
})

test("CABAC: elevated action only inside an emergency window", () => {
  assert.equal(can(subjectForRoles(["DEO"]), "override:lockdown").permitted, false)
  assert.equal(
    can(subjectForRoles(["DEO"]), "override:lockdown", { type: "school" }, { emergency: true, threatLevel: "low" })
      .permitted,
    true,
  )
})

test("requireAccess throws AccessDeniedError on denial", () => {
  assert.doesNotThrow(() => requireAccess(subjectForRoles(["ADMIN"]), "manage:school"))
  assert.throws(() => requireAccess(subjectForRoles(["STUDENT"]), "manage:school"), AccessDeniedError)
})

test("allActions returns a sorted, de-duplicated catalog without the wildcard", () => {
  const actions = allActions()
  assert.ok(actions.length > 0)
  assert.ok(!actions.includes("*"))
  assert.deepEqual(actions, [...actions].sort())
  assert.ok(actions.includes("file:grievance"))
})
