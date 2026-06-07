import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { __setTestDb } from "@/lib/persistence"
import { listIncidents, logIncident } from "@/lib/discipline/store"
import { listStudents, createStudent } from "@/lib/cwsn/store"
import { listItems } from "@/lib/lostfound/store"
import { listCooks } from "@/lib/cooks/store"
import { scopeRecords, SCOPE_TENANTS, DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"

beforeEach(() => __setTestDb(null)) // in-memory seeded path
afterEach(() => __setTestDb(undefined))

test("discipline incidents are scopable by jurisdiction", async () => {
  const all = await listIncidents()
  assert.ok(scopeRecords(SCOPE_TENANTS, "TN", all).length >= 3) // state sees all seeds
  const chennai = scopeRecords(SCOPE_TENANTS, "TN-CHN", all)
  assert.ok(chennai.length >= 2)
  assert.ok(!chennai.some((i) => i.tenantId === "TN-CBE-B1-S1")) // not Coimbatore
})

test("cwsn learners are scopable; a single school sees only its own", async () => {
  const all = await listStudents()
  assert.ok(scopeRecords(SCOPE_TENANTS, "TN", all).length >= 3)
  const oneSchool = scopeRecords(SCOPE_TENANTS, "TN-CHN-B2-S1", all)
  assert.ok(oneSchool.length >= 1)
  assert.ok(oneSchool.every((s) => s.tenantId === "TN-CHN-B2-S1"))
})

test("lost-found and cooks seeds are scopable by jurisdiction", async () => {
  const items = await listItems()
  assert.ok(scopeRecords(SCOPE_TENANTS, "TN", items).length >= 3)
  assert.ok(scopeRecords(SCOPE_TENANTS, "TN-CHN", items).every((i) => i.tenantId !== "TN-CBE-B1-S1"))

  const cooks = await listCooks()
  assert.ok(scopeRecords(SCOPE_TENANTS, "TN", cooks).length >= 3)
  assert.equal(scopeRecords(SCOPE_TENANTS, "TN-CBE-B1-S1", cooks).length, 1)
})

test("new records default to the demo school node when tenantId is omitted", async () => {
  const inc = await logIncident({ student: "Z", type: "Other", severity: "minor", action: "noted" })
  assert.equal(inc.tenantId, DEFAULT_SCHOOL_NODE)
  const st = await createStudent({ name: "Z", cls: "1A", disability: "Other", supports: [], iepGoal: "" })
  assert.equal(st.tenantId, DEFAULT_SCHOOL_NODE)
})
