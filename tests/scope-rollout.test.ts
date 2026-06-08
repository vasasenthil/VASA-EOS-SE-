import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { __setTestDb } from "@/lib/persistence"
import { listIncidents, logIncident } from "@/lib/discipline/store"
import { listStudents, createStudent } from "@/lib/cwsn/store"
import { listItems } from "@/lib/lostfound/store"
import { listCooks } from "@/lib/cooks/store"
import { listApplicants } from "@/lib/rte/store"
import { listRti } from "@/lib/rti/store"
import { listChildren } from "@/lib/oosc/store"
import { listTests } from "@/lib/water/store"
import { listCameras } from "@/lib/cctv/store"
import { listDrills } from "@/lib/drills/store"
import { listEntries } from "@/lib/competitions/store"
import { listTrips } from "@/lib/excursions/store"
import { listTc } from "@/lib/tc/store"
import { listVisitors } from "@/lib/visitors/store"
import { listLoans } from "@/lib/circulation/store"
import { listAlumni } from "@/lib/alumni/store"
import { listDistribution } from "@/lib/distribution/store"
import { listCertificates } from "@/lib/certificates/store"
import { listActivities } from "@/lib/eco/store"
import { listCadets } from "@/lib/youth/store"
import { listAccounts } from "@/lib/banking/store"
import { listRecords } from "@/lib/fitness/store"
import { listReaders } from "@/lib/reading/store"
import { listMovements } from "@/lib/stock/store"
import { listSessions } from "@/lib/ictlab/store"
import { listEnrolments } from "@/lib/vocational/store"
import { listHomework } from "@/lib/homework/store"
import { listEntries as listMdm } from "@/lib/mdm/store"
import { listResults } from "@/lib/sports/store"
import { listProjects } from "@/lib/sciencefair/store"
import { listLectures } from "@/lib/guestlectures/store"
import { listCandidates } from "@/lib/council/store"
import { listAssemblies } from "@/lib/assembly/store"
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

test("rte/rti/oosc/water/cctv seeds are all scopable by jurisdiction", async () => {
  const lists: Array<() => Promise<{ tenantId: string }[]>> = [
    listApplicants,
    listRti,
    listChildren,
    listTests,
    listCameras,
  ]
  for (const list of lists) {
    const all = await list()
    assert.ok(scopeRecords(SCOPE_TENANTS, "TN", all).length >= 3, "state sees all seeds")
    // A single Coimbatore school sees only its own record, never Chennai's.
    const cbe = scopeRecords(SCOPE_TENANTS, "TN-CBE-B1-S1", all)
    assert.ok(cbe.every((r) => r.tenantId === "TN-CBE-B1-S1"))
    assert.equal(cbe.length, 1)
  }
})

test("drills/competitions/excursions/tc/visitors seeds are all scopable", async () => {
  const lists: Array<() => Promise<{ tenantId: string }[]>> = [
    listDrills,
    listEntries,
    listTrips,
    listTc,
    listVisitors,
  ]
  for (const list of lists) {
    const all = await list()
    assert.ok(scopeRecords(SCOPE_TENANTS, "TN", all).length >= 3, "state sees all seeds")
    const cbe = scopeRecords(SCOPE_TENANTS, "TN-CBE-B1-S1", all)
    assert.ok(cbe.every((r) => r.tenantId === "TN-CBE-B1-S1"))
    assert.equal(cbe.length, 1)
  }
})

test("circulation/alumni/distribution/certificates seeds are all scopable", async () => {
  const lists: Array<() => Promise<{ tenantId: string }[]>> = [
    listLoans,
    listAlumni,
    listDistribution,
    listCertificates,
  ]
  for (const list of lists) {
    const all = await list()
    assert.ok(scopeRecords(SCOPE_TENANTS, "TN", all).length >= 3, "state sees all seeds")
    // Chennai district never sees Coimbatore's records.
    assert.ok(scopeRecords(SCOPE_TENANTS, "TN-CHN", all).every((r) => r.tenantId !== "TN-CBE-B1-S1"))
  }
})

test("stock/sciencefair/guestlectures/council/assembly seeds are all scopable", async () => {
  const lists: Array<() => Promise<{ tenantId: string }[]>> = [
    listMovements,
    listProjects,
    listLectures,
    listCandidates,
    listAssemblies,
  ]
  for (const list of lists) {
    const all = await list()
    assert.ok(scopeRecords(SCOPE_TENANTS, "TN", all).length >= 3, "state sees all seeds")
    const cbe = scopeRecords(SCOPE_TENANTS, "TN-CBE-B1-S1", all)
    assert.ok(cbe.every((r) => r.tenantId === "TN-CBE-B1-S1"))
    assert.equal(cbe.length, 1)
  }
})

test("eco/youth/banking/fitness/reading seeds are all scopable", async () => {
  const lists: Array<() => Promise<{ tenantId: string }[]>> = [
    listActivities,
    listCadets,
    listAccounts,
    listRecords,
    listReaders,
  ]
  for (const list of lists) {
    const all = await list()
    assert.ok(scopeRecords(SCOPE_TENANTS, "TN", all).length >= 3, "state sees all seeds")
    const cbe = scopeRecords(SCOPE_TENANTS, "TN-CBE-B1-S1", all)
    assert.ok(cbe.every((r) => r.tenantId === "TN-CBE-B1-S1"))
    assert.equal(cbe.length, 1)
  }
})

test("ictlab/vocational/homework/mdm/sports seeds are all scopable", async () => {
  const lists: Array<() => Promise<{ tenantId: string }[]>> = [
    listSessions,
    listEnrolments,
    listHomework,
    listMdm,
    listResults,
  ]
  for (const list of lists) {
    const all = await list()
    assert.ok(scopeRecords(SCOPE_TENANTS, "TN", all).length >= 3, "state sees all seeds")
    const cbe = scopeRecords(SCOPE_TENANTS, "TN-CBE-B1-S1", all)
    assert.ok(cbe.every((r) => r.tenantId === "TN-CBE-B1-S1"))
    assert.equal(cbe.length, 1)
  }
})

test("new records default to the demo school node when tenantId is omitted", async () => {
  const inc = await logIncident({ student: "Z", type: "Other", severity: "minor", action: "noted" })
  assert.equal(inc.tenantId, DEFAULT_SCHOOL_NODE)
  const st = await createStudent({ name: "Z", cls: "1A", disability: "Other", supports: [], iepGoal: "" })
  assert.equal(st.tenantId, DEFAULT_SCHOOL_NODE)
})
