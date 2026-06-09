import { test } from "node:test"
import assert from "node:assert/strict"
import { DIRECTORY, subjectForUser, grantsForUser, directorySummary } from "@/lib/directory"
import { PORTALS, type PortalRole } from "@/config/portals"
import { getOrg } from "@/lib/org"
import { can } from "@/lib/access/policy"

test("every portal role has at least one directory user", () => {
  const covered = new Set(DIRECTORY.map((d) => d.role))
  for (const role of Object.keys(PORTALS) as PortalRole[]) {
    assert.ok(covered.has(role), `no user for role: ${role}`)
  }
})

test("usernames and emails are unique", () => {
  assert.equal(new Set(DIRECTORY.map((d) => d.username)).size, DIRECTORY.length)
  assert.equal(new Set(DIRECTORY.map((d) => d.email)).size, DIRECTORY.length)
})

test("every user is bound to a real org unit", () => {
  for (const d of DIRECTORY) assert.ok(getOrg(d.orgId), `bad orgId for ${d.id}: ${d.orgId}`)
})

test("there are 7 directorate Directors", () => {
  assert.equal(DIRECTORY.filter((d) => d.role === "DIRECTOR").length, 7)
})

test("subjectForUser carries role, attributes and relations into the PDP", () => {
  const teacher = DIRECTORY.find((d) => d.id === "teacher-egmore")!
  const subj = subjectForUser(teacher)
  assert.deepEqual(subj.roles, ["TEACHER"])
  assert.equal(subj.attributes?.suspended, false)
  const teaches = subj.relations?.teaches
  assert.ok(Array.isArray(teaches) && teaches.includes("33010100101:9A"))
  // RBAC via the platform policy
  assert.equal(can(subj, "write:attendance").permitted, true)
  assert.equal(can(subj, "disburse:dbt").permitted, false)
})

test("admin holds the wildcard grant; summary covers all roles", () => {
  const admin = DIRECTORY.find((d) => d.role === "ADMIN")!
  assert.ok(grantsForUser(admin).includes("*"))
  const s = directorySummary()
  assert.equal(s.total, DIRECTORY.length)
  assert.equal(s.roles, Object.keys(PORTALS).length)
})
