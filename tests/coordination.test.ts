import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  COORDINATION_INITIATIVES,
  initiativeById,
  byStatus,
  byPartnerType,
  coordinationSummary,
  toCSV,
} from "@/lib/governance/coordination"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("initiatives are well-formed with a valid partner type and status", () => {
  const ids = new Set<string>()
  for (const i of COORDINATION_INITIATIVES) {
    assert.ok(!ids.has(i.id), `duplicate ${i.id}`)
    ids.add(i.id)
    assert.ok(i.title && i.partner && i.purpose)
    assert.ok(["department", "csr", "multilateral", "cso"].includes(i.partnerType))
    assert.ok(["active", "proposed", "completed"].includes(i.status))
  }
})

test("every initiative links a real in-repo module (self-verifying)", () => {
  for (const i of COORDINATION_INITIATIVES) {
    assert.ok(existsSync(join(repoRoot, i.linkedModule)), `${i.id} → missing module ${i.linkedModule}`)
  }
})

test("the desk engages both government departments and external partners", () => {
  assert.ok(byPartnerType("department").length >= 1)
  assert.ok(byPartnerType("csr").length >= 1)
  assert.equal(initiativeById("rbsk-health")?.partnerType, "department")
  assert.equal(initiativeById("csr-smartclass")?.partnerType, "csr")
})

test("summary tallies status, departments, external partners and modules", () => {
  const s = coordinationSummary()
  assert.equal(s.initiatives, COORDINATION_INITIATIVES.length)
  assert.equal(s.active + s.proposed + s.completed, s.initiatives)
  const deptInitiatives = byPartnerType("department").length
  assert.equal(s.externalPartners, s.initiatives - deptInitiatives) // every non-department initiative
  assert.ok(s.departments >= 1 && s.departments <= deptInitiatives) // distinct ≤ count
  assert.ok(s.externalPartners >= 1)
  assert.ok(s.modulesLinked >= 1 && s.modulesLinked <= s.initiatives)
  assert.ok(byStatus("active").length >= 1)
})

test("CSV has a header plus one row per initiative", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Initiative,Partner,Type,Purpose,Module,Status")
  assert.equal(lines.length, COORDINATION_INITIATIVES.length + 1)
})
