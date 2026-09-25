import assert from "node:assert/strict"
import test from "node:test"
import { NextRequest } from "next/server"
import { installAuthFixture } from "./helpers/auth-fixture"
import { getSessionFromRequest, sessionFromJwt } from "@/lib/auth/session"
const issue = installAuthFixture()

test("forged ADMIN payload never establishes a session", async () => {
  const payload = Buffer.from(JSON.stringify({ sub: "attacker", app_metadata: { roles: ["ADMIN"] } })).toString("base64url")
  assert.equal(await sessionFromJwt(`eyJhbGciOiJub25lIn0.${payload}.`), null)
})
test("verified identity uses app metadata exclusively for roles and tenant", async () => {
  const session = await sessionFromJwt(issue({ sub: "teacher", app_metadata: { roles: ["TEACHER"], school_id: "school-a" }, user_metadata: { roles: ["ADMIN"], school_id: "school-b" } }))
  assert.deepEqual(session?.roles, ["TEACHER"])
  assert.equal(session?.tenant.schoolId, "school-a")
  const noAuthority = await sessionFromJwt(issue({ sub: "user", user_metadata: { roles: ["ADMIN"], school_id: "school-b" } }))
  assert.deepEqual(noAuthority?.roles, [])
  assert.equal(noAuthority?.tenant.schoolId, undefined)
})
test("invalid explicit authorization cannot become a cookie session", async () => {
  const req = new NextRequest("https://example.test", { headers: { authorization: "Basic invalid" } })
  assert.equal(await getSessionFromRequest(req), null)
})
