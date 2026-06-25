import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"

import { createLecture, getLecture, deleteLecture, listLectures } from "@/lib/guestlectures/store"
import { createSession, getSession, deleteSession, listSessions } from "@/lib/ictlab/store"
import { raiseTicket, advanceTicket, getTicket, deleteTicket, listTickets } from "@/lib/maintenance/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("guest-lectures: log, get, delete via the DB path", async () => {
  const l = await createLecture({ speaker: "Dr K", topic: "Careers in AI", org: "Anna University", domain: "Career guidance", date: "2026-06-05", audience: 60, cls: "9-10" })
  assert.equal((await getLecture(l.id))?.topic, "Careers in AI")
  assert.ok((await listLectures()).some((x) => x.id === l.id))
  assert.equal(await deleteLecture(l.id), true)
  assert.equal(await getLecture(l.id), undefined)
})

test("ict-lab: log session, get, delete via the DB path", async () => {
  const sn = await createSession({ cls: "8A", subject: "Coding / robotics", date: "2026-06-05", students: 40, devicesWorking: 20, devicesTotal: 25 })
  assert.equal((await getSession(sn.id))?.devicesWorking, 20)
  assert.ok((await listSessions()).some((x) => x.id === sn.id))
  assert.equal(await deleteSession(sn.id), true)
})

test("maintenance: raise, advance to resolved, delete via the DB path", async () => {
  const t = await raiseTicket({ category: "Electrical", description: "Fan not working", priority: "high" })
  assert.equal(t.status, "open")
  assert.equal((await advanceTicket(t.id))?.status, "in_progress")
  assert.equal((await advanceTicket(t.id))?.status, "resolved")
  assert.equal((await getTicket(t.id))?.status, "resolved")
  assert.ok((await listTickets()).some((x) => x.id === t.id))
  assert.equal(await deleteTicket(t.id), true)
  assert.equal(await advanceTicket("missing"), undefined)
})

test("in-memory fallback works for all three when no DB is configured", async () => {
  __setTestDb(null)
  const l = await createLecture({ speaker: "S", topic: "T", org: "O", domain: "STEM / innovation", date: "2026-06-06", audience: 30, cls: "All" })
  assert.ok((await listLectures()).some((x) => x.id === l.id))
  const sn = await createSession({ cls: "7B", subject: "Science", date: "2026-06-06", students: 30, devicesWorking: 30, devicesTotal: 30 })
  assert.ok((await listSessions()).some((x) => x.id === sn.id))
  const t = await raiseTicket({ category: "Plumbing", description: "Leak", priority: "medium" })
  assert.equal((await advanceTicket(t.id))?.status, "in_progress")
})
