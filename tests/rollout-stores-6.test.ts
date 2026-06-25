import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"

import { createCadet, logCadetHours, getCadet, deleteCadet, listCadets } from "@/lib/youth/store"
import { createAssembly, getAssembly, deleteAssembly, listAssemblies } from "@/lib/assembly/store"
import { openAccount, transact, getAccount, deleteAccount, listAccounts } from "@/lib/banking/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("youth: enrol, log hours (accumulate), delete via the DB path", async () => {
  const c = await createCadet({ name: "Suresh", cls: "9A", wing: "NSS" })
  assert.equal(c.serviceHours, 0)
  assert.equal((await logCadetHours(c.id, 2))?.serviceHours, 2)
  assert.equal((await logCadetHours(c.id, 3))?.serviceHours, 5)
  assert.equal((await getCadet(c.id))?.serviceHours, 5)
  assert.ok((await listCadets()).some((x) => x.id === c.id))
  assert.equal(await deleteCadet(c.id), true)
  assert.equal(await logCadetHours("missing", 2), undefined)
})

test("assembly: log, get, delete via the DB path", async () => {
  const a = await createAssembly({ date: "2026-06-05", cls: "8B", theme: "Patriotism", conductedBy: "Teacher", thought: "Service before self" })
  assert.equal((await getAssembly(a.id))?.theme, "Patriotism")
  assert.ok((await listAssemblies()).some((x) => x.id === a.id))
  assert.equal(await deleteAssembly(a.id), true)
  assert.equal(await getAssembly(a.id), undefined)
})

test("banking: open, deposit, withdraw (never overdraw), delete via the DB path", async () => {
  const acc = await openAccount({ student: "Priya", cls: "6A", opening: 100 })
  assert.equal(acc.balance, 100)
  assert.equal((await transact(acc.id, "deposit", 50))?.balance, 150)
  assert.equal((await transact(acc.id, "withdraw", 30))?.balance, 120)
  assert.equal((await transact(acc.id, "withdraw", 1000))?.balance, 0) // capped, no overdraft
  assert.equal((await getAccount(acc.id))?.balance, 0)
  assert.ok((await listAccounts()).some((x) => x.id === acc.id))
  assert.equal(await deleteAccount(acc.id), true)
  assert.equal(await transact("missing", "deposit", 10), undefined)
})

test("in-memory fallback works for all three when no DB is configured", async () => {
  __setTestDb(null)
  const c = await createCadet({ name: "Z", cls: "10A", wing: "Scouts & Guides" })
  assert.equal((await logCadetHours(c.id, 4))?.serviceHours, 4)
  const a = await createAssembly({ date: "2026-06-06", cls: "7A", theme: "Gratitude & kindness", conductedBy: "Student", thought: "" })
  assert.ok((await listAssemblies()).some((x) => x.id === a.id))
  const acc = await openAccount({ student: "Y", cls: "5A", opening: 0 })
  assert.equal((await transact(acc.id, "deposit", 25))?.balance, 25)
})
