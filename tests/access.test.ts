import { test } from "node:test"
import assert from "node:assert/strict"
import { authorize, type EngineConfig } from "@/lib/access"

const config: EngineConfig = {
  grants: { ADMIN: ["read:student"], CLERK: [] },
  policies: [{ id: "deny-suspended", effect: "deny", matches: (req) => req.subject.attributes?.suspended === true }],
  cabacElevatedActions: ["override:lockdown"],
}

test("RBAC grants a permitted role/action", () => {
  const d = authorize(config, { subject: { userId: "u", roles: ["ADMIN"] }, action: "read:student", resource: { type: "student" } })
  assert.equal(d.permitted, true)
})

test("deny policy wins over a role grant (deny-wins)", () => {
  const d = authorize(config, {
    subject: { userId: "u", roles: ["ADMIN"], attributes: { suspended: true } },
    action: "read:student",
    resource: { type: "student" },
  })
  assert.equal(d.permitted, false)
})

test("fail-closed when no model grants", () => {
  const d = authorize(config, { subject: { userId: "u", roles: ["CLERK"] }, action: "approve:dbt", resource: { type: "scheme" } })
  assert.equal(d.permitted, false)
})

test("CABAC elevates only inside an emergency window", () => {
  const base = { subject: { userId: "u", roles: [] as string[] }, action: "override:lockdown", resource: { type: "school" } }
  assert.equal(authorize(config, { ...base, context: { emergency: false } }).permitted, false)
  assert.equal(authorize(config, { ...base, context: { emergency: true, threatLevel: "low" } }).permitted, true)
})

test("CABAC stays closed under high threat even in emergency", () => {
  const d = authorize(config, {
    subject: { userId: "u", roles: [] },
    action: "override:lockdown",
    resource: { type: "school" },
    context: { emergency: true, threatLevel: "high" },
  })
  assert.equal(d.permitted, false)
})
