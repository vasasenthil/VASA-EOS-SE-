import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"

import { createItem, claimItem, getItem, deleteItem, listItems } from "@/lib/lostfound/store"
import { createCook, setCookPresence, getCook, deleteCook, listCooks } from "@/lib/cooks/store"
import { createTc, advanceTc, getTc, deleteTc, listTc } from "@/lib/tc/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("lost & found: create, claim, get, delete via the DB path", async () => {
  const it = await createItem({ name: "Bottle", description: "blue", location: "Gate", reportedBy: "Desk", status: "found" })
  assert.ok((await listItems()).some((x) => x.id === it.id))
  assert.equal((await getItem(it.id))?.name, "Bottle")
  assert.equal((await claimItem(it.id))?.status, "claimed")
  assert.equal(await deleteItem(it.id), true)
  assert.equal(await getItem(it.id), undefined)
  assert.equal(await claimItem("missing"), undefined)
})

test("cooks: create, toggle presence, get, delete via the DB path", async () => {
  const c = await createCook({ name: "Lakshmi", role: "Cook", honorarium: 1000 })
  assert.equal(c.present, true)
  assert.equal((await setCookPresence(c.id, false))?.present, false)
  assert.equal((await getCook(c.id))?.present, false)
  assert.ok((await listCooks()).some((x) => x.id === c.id))
  assert.equal(await deleteCook(c.id), true)
  assert.equal(await setCookPresence("missing", true), undefined)
})

test("tc: create, advance to issued (stamps number), delete via the DB path", async () => {
  const t = await createTc({ student: "Aarthi", cls: "10A", reason: "Relocation" })
  assert.equal(t.status, "requested")
  assert.equal((await advanceTc(t.id))?.status, "verified")
  const issued = await advanceTc(t.id)
  assert.equal(issued?.status, "issued")
  assert.match(issued?.reason ?? "", /TC\/\d{4}\/\d{4}/) // TC number stamped
  assert.equal((await getTc(t.id))?.status, "issued")
  assert.equal(await deleteTc(t.id), true)
  assert.equal(await advanceTc("missing"), undefined)
})

test("in-memory fallback path works when no DB is configured", async () => {
  __setTestDb(null)
  const it = await createItem({ name: "Cap", description: "", location: "", reportedBy: "Desk", status: "lost" })
  assert.ok((await listItems()).some((x) => x.id === it.id))
  const c = await createCook({ name: "Raj", role: "Helper", honorarium: 800 })
  assert.equal((await setCookPresence(c.id, false))?.present, false)
  const t = await createTc({ student: "Bharath", cls: "9B", reason: "Migration" })
  assert.equal((await advanceTc(t.id))?.status, "verified")
  assert.equal(await deleteItem(it.id), true)
})
