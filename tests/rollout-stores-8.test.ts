import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"

import { createLine, getLine, deleteLine, listLines } from "@/lib/vacancy/store"
import { createIndent, receiveCopies, getIndent, deleteIndent, listIndents } from "@/lib/textbooks/store"
import { createActivity, getActivity, deleteActivity, listActivities } from "@/lib/eco/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("vacancy: add line, get, list, delete via the DB path", async () => {
  const l = await createLine({ subject: "Graduate (BT Assistant)", sanctioned: 5, working: 3 })
  assert.equal((await getLine(l.id))?.sanctioned, 5)
  assert.ok((await listLines()).some((x) => x.id === l.id))
  assert.equal(await deleteLine(l.id), true)
  assert.equal(await getLine(l.id), undefined)
})

test("textbooks: indent, receive (clamped to required), delete via the DB path", async () => {
  const it = await createIndent({ cls: "5", subject: "Maths", required: 100 })
  assert.equal(it.received, 0)
  assert.equal((await receiveCopies(it.id, 60))?.received, 60)
  assert.equal((await receiveCopies(it.id, 999))?.received, 100) // capped at required
  assert.equal((await receiveCopies(it.id, -1000))?.received, 0) // never below 0
  assert.equal((await getIndent(it.id))?.required, 100)
  assert.ok((await listIndents()).some((x) => x.id === it.id))
  assert.equal(await deleteIndent(it.id), true)
  assert.equal(await receiveCopies("missing", 10), undefined)
})

test("eco: log activity, get, delete via the DB path", async () => {
  const a = await createActivity({ title: "Plantation drive", type: "Tree plantation", saplings: 100, survived: 80, date: "2026-06-05" })
  assert.equal((await getActivity(a.id))?.saplings, 100)
  assert.ok((await listActivities()).some((x) => x.id === a.id))
  assert.equal(await deleteActivity(a.id), true)
  assert.equal(await getActivity(a.id), undefined)
})

test("in-memory fallback works for all three when no DB is configured", async () => {
  __setTestDb(null)
  const l = await createLine({ subject: "Physical Education", sanctioned: 2, working: 1 })
  assert.ok((await listLines()).some((x) => x.id === l.id))
  const it = await createIndent({ cls: "6", subject: "Science", required: 40 })
  assert.equal((await receiveCopies(it.id, 40))?.received, 40)
  const a = await createActivity({ title: "Nature walk", type: "Nature walk / bird count", saplings: 0, survived: 0, date: "2026-06-06" })
  assert.ok((await listActivities()).some((x) => x.id === a.id))
  assert.equal(await deleteLine(l.id), true)
})
