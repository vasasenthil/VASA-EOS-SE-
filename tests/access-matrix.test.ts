import { test } from "node:test"
import assert from "node:assert/strict"
import { DEFAULT_GRANTS } from "@/config/portals"
import {
  ROLES,
  accessMatrix,
  permissionsFor,
  rolesWith,
  isElevated,
  matrixSummary,
  toCSV,
} from "@/lib/access/matrix"
import { allActions, ELEVATED_ACTIONS } from "@/lib/access/policy"

test("roles are derived from the grant table (single source of truth)", () => {
  assert.equal(ROLES.length, Object.keys(DEFAULT_GRANTS).length)
  assert.ok(ROLES.includes("ADMIN"))
  assert.ok(ROLES.includes("PUBLIC"))
})

test("the matrix is the live PDP output: permissionsFor and rolesWith agree", () => {
  const matrix = accessMatrix()
  assert.equal(matrix.length, ROLES.length)
  for (const { role, actions } of matrix) {
    // every listed action is one rolesWith() also reports for this role
    for (const a of actions) assert.ok(rolesWith(a).includes(role), `${role} ↔ ${a} inconsistent`)
    assert.deepEqual(actions, permissionsFor(role)) // computed the same way
  }
})

test("least privilege gradient holds: PUBLIC ⊂ ADMIN", () => {
  const pub = permissionsFor("PUBLIC")
  const admin = permissionsFor("ADMIN")
  assert.ok(pub.length < admin.length, "PUBLIC must have fewer permissions than ADMIN")
  assert.ok(pub.length <= 5, "PUBLIC should be tightly scoped")
})

test("elevated actions are restricted, not granted to every role", () => {
  for (const a of ELEVATED_ACTIONS) {
    assert.ok(isElevated(a))
    assert.ok(rolesWith(a).length < ROLES.length, `${a} must not be available to all roles`)
  }
})

test("summary tallies roles, actions and the most-restricted action", () => {
  const s = matrixSummary()
  assert.equal(s.roles, ROLES.length)
  assert.equal(s.actions, allActions().length)
  assert.equal(s.elevatedActions, ELEVATED_ACTIONS.length)
  assert.ok(s.mostRestrictedAction.length > 0)
})

test("CSV has a header plus one row per role", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Role,Permitted actions,Count")
  assert.equal(lines.length, ROLES.length + 1)
})
