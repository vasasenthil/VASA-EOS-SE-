import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"

import { createHomework, advanceHomework, getHomework, deleteHomework, listHomework } from "@/lib/homework/store"
import { fileLeave, decideLeave, getLeave, deleteLeave, listLeave } from "@/lib/leave/store"
import { logIncident, resolveIncident, getIncident, deleteIncident, listIncidents } from "@/lib/discipline/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("homework: assign, advance to graded, delete via the DB path", async () => {
  const h = await createHomework({ subject: "Science", title: "Ch 4", dueDate: "2026-06-10" })
  assert.equal(h.status, "assigned")
  assert.equal((await advanceHomework(h.id))?.status, "submitted")
  assert.equal((await advanceHomework(h.id))?.status, "graded")
  assert.equal((await getHomework(h.id))?.status, "graded")
  assert.ok((await listHomework()).some((x) => x.id === h.id))
  assert.equal(await deleteHomework(h.id), true)
  assert.equal(await advanceHomework("missing"), undefined)
})

test("leave: file, approve/reject, delete via the DB path", async () => {
  const r = await fileLeave({ teacher: "Mrs R", type: "casual", from: "2026-06-10", to: "2026-06-11", reason: "personal" })
  assert.equal(r.status, "pending")
  assert.equal((await decideLeave(r.id, "approved"))?.status, "approved")
  assert.equal((await getLeave(r.id))?.status, "approved")
  assert.ok((await listLeave()).some((x) => x.id === r.id))
  assert.equal(await deleteLeave(r.id), true)
  assert.equal(await decideLeave("missing", "rejected"), undefined)
})

test("discipline: log incident, resolve, delete via the DB path", async () => {
  const inc = await logIncident({ student: "A", type: "Bullying", severity: "serious", action: "Counselling" })
  assert.equal(inc.status, "open")
  assert.equal((await resolveIncident(inc.id))?.status, "resolved")
  assert.equal((await getIncident(inc.id))?.status, "resolved")
  assert.ok((await listIncidents()).some((x) => x.id === inc.id))
  assert.equal(await deleteIncident(inc.id), true)
  assert.equal(await resolveIncident("missing"), undefined)
})

test("in-memory fallback works for all three when no DB is configured", async () => {
  __setTestDb(null)
  const h = await createHomework({ subject: "Maths", title: "Worksheet", dueDate: "2026-06-12" })
  assert.equal((await advanceHomework(h.id))?.status, "submitted")
  const r = await fileLeave({ teacher: "Mr S", type: "medical", from: "2026-06-10", to: "2026-06-12", reason: "fever" })
  assert.equal((await decideLeave(r.id, "rejected"))?.status, "rejected")
  const inc = await logIncident({ student: "B", type: "Safety", severity: "moderate", action: "Warning" })
  assert.equal((await resolveIncident(inc.id))?.status, "resolved")
  assert.ok((await listHomework()).some((x) => x.id === h.id))
})
