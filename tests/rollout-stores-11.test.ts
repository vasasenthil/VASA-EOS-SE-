import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"

import { fileTransfer, advanceTransfer, rejectTransfer, getTransfer, deleteTransfer, listTransfers } from "@/lib/postings/store"
import { publishNotice, setPinned, getNotice, deleteNotice, listNotices } from "@/lib/notices/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("postings: file -> approve -> post; reject path; delete (DB path)", async () => {
  const t = await fileTransfer({ teacher: "Mrs R", fromSchool: "A", toSchool: "B", reason: "mutual" })
  assert.equal(t.status, "requested")
  assert.equal((await advanceTransfer(t.id))?.status, "approved")
  assert.equal((await advanceTransfer(t.id))?.status, "posted")
  assert.equal((await getTransfer(t.id))?.status, "posted")

  const t2 = await fileTransfer({ teacher: "Mr S", fromSchool: "A", toSchool: "C", reason: "health" })
  assert.equal((await rejectTransfer(t2.id))?.status, "rejected")
  assert.ok((await listTransfers()).length >= 2)
  assert.equal(await deleteTransfer(t.id), true)
  assert.equal(await advanceTransfer("missing"), undefined)
})

test("notices: publish (Urgent auto-pins), toggle pin, delete (DB path)", async () => {
  const n = await publishNotice({ title: "Exam timetable", body: "x", category: "Examination", audience: "All" })
  assert.equal(n.pinned, false)
  const u = await publishNotice({ title: "Closure", body: "storm", category: "Urgent", audience: "All" })
  assert.equal(u.pinned, true) // Urgent auto-pins
  assert.equal((await setPinned(n.id, true))?.pinned, true)
  assert.equal((await getNotice(n.id))?.pinned, true)
  assert.ok((await listNotices()).some((x) => x.id === n.id))
  assert.equal(await deleteNotice(n.id), true)
  assert.equal(await setPinned("missing", true), undefined)
})

test("in-memory fallback works for both (notices seeded with samples)", async () => {
  __setTestDb(null)
  assert.ok((await listNotices()).length >= 2) // seeded sample notices
  const t = await fileTransfer({ teacher: "Z", fromSchool: "A", toSchool: "B", reason: "" })
  assert.equal((await advanceTransfer(t.id))?.status, "approved")
})
