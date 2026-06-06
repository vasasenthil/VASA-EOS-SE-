import { test } from "node:test"
import assert from "node:assert/strict"
import { demoAuthenticate, DEMO_USERS, DEMO_PASSWORD } from "@/lib/demo-auth"

test("valid demo credentials return the mapped role", () => {
  assert.equal(demoAuthenticate("admin@vasa-eos.tn.gov.in", DEMO_PASSWORD), "ADMIN")
  assert.equal(demoAuthenticate("minister@vasa-eos.tn.gov.in", DEMO_PASSWORD), "MINISTER")
  assert.equal(demoAuthenticate("teacher-egmore@vasa-eos.tn.gov.in", DEMO_PASSWORD), "TEACHER")
})

test("email match is case- and whitespace-insensitive", () => {
  assert.equal(demoAuthenticate("  ADMIN@VASA-EOS.TN.GOV.IN ", DEMO_PASSWORD), "ADMIN")
})

test("wrong password or unknown email returns null", () => {
  assert.equal(demoAuthenticate("admin@vasa-eos.tn.gov.in", "wrong"), null)
  assert.equal(demoAuthenticate("nobody@vasa-eos.tn.gov.in", DEMO_PASSWORD), null)
})

test("every demo role is a known portal role string", () => {
  const roles = new Set(Object.values(DEMO_USERS))
  assert.ok(roles.has("DIRECTOR"))
  assert.equal(Object.keys(DEMO_USERS).length, 23)
})
