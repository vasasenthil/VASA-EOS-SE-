import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { raiseTicketFlow, actOnTicket, getTicketFlow, deleteTicketFlow, listTicketFlows } from "@/lib/maintenanceflow/store"
import { saveSheet, getSheet, deleteSheet, listSheets } from "@/lib/staff-attendance/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("maintenance: Principal triage -> Vendor work -> Principal close; role-gated closure", async () => {
  const t = await raiseTicketFlow({ category: "Electrical", description: "fan", priority: "high" })
  assert.equal(t.instance.status, "in_progress")
  // Vendor can't triage first.
  assert.equal((await actOnTicket(t.id, { actorRole: "VENDOR", actor: "v", decision: "approve" })).ok, false)
  let res = await actOnTicket(t.id, { actorRole: "PRINCIPAL", actor: "HM", decision: "approve" }) // triage
  assert.equal(res.record?.instance.status, "in_progress")
  res = await actOnTicket(t.id, { actorRole: "VENDOR", actor: "v", decision: "approve" }) // work done
  assert.equal(res.record?.instance.status, "in_progress")
  // Vendor cannot close — only the Principal.
  assert.equal((await actOnTicket(t.id, { actorRole: "VENDOR", actor: "v", decision: "approve" })).ok, false)
  res = await actOnTicket(t.id, { actorRole: "PRINCIPAL", actor: "HM", decision: "approve" }) // close
  assert.equal(res.record?.instance.status, "approved")
  assert.equal((await getTicketFlow(t.id))?.instance.status, "approved")
  assert.ok((await listTicketFlows()).some((x) => x.id === t.id))
  assert.equal(await deleteTicketFlow(t.id), true)
})

test("staff-attendance: save a dated sheet snapshot, list, delete (DB path) + in-memory", async () => {
  const s = await saveSheet({ date: "2026-06-06", records: { "Mrs R": "present", "Mr S": "absent" }, pct: 50 })
  assert.equal((await getSheet(s.id))?.pct, 50)
  assert.deepEqual((await getSheet(s.id))?.records["Mr S"], "absent")
  assert.ok((await listSheets()).some((x) => x.id === s.id))
  assert.equal(await deleteSheet(s.id), true)

  __setTestDb(null)
  const s2 = await saveSheet({ date: "2026-06-07", records: { A: "late" }, pct: 100 })
  assert.ok((await listSheets()).some((x) => x.id === s2.id))
})
