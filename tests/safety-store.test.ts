import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { createConcern, advanceConcern, getConcern, deleteConcern, listConcerns } from "@/lib/safety/store"

// --- DB-backed path (the production path), exercised via the in-memory fake DB ---
test("safety store: create, advance, get, delete via the DB path", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  try {
    const c = await createConcern({ category: "Anti-ragging", description: "Hostel incident", action: "Committee notified" })
    assert.equal(c.status, "reported")

    const listed = await listConcerns()
    assert.ok(listed.find((x) => x.id === c.id))
    assert.equal((await getConcern(c.id))?.category, "Anti-ragging")

    const a1 = await advanceConcern(c.id)
    assert.equal(a1?.status, "under_review")
    const a2 = await advanceConcern(c.id)
    assert.equal(a2?.status, "resolved")

    assert.equal(await deleteConcern(c.id), true)
    assert.equal(await getConcern(c.id), undefined)
    assert.equal(await deleteConcern(c.id), false)
  } finally {
    __setTestDb(undefined)
  }
})

test("safety store: advancing a missing id returns undefined (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  try {
    assert.equal(await advanceConcern("nope"), undefined)
  } finally {
    __setTestDb(undefined)
  }
})

// --- In-memory fallback path (no DB configured) ---
test("safety store: create, list, advance and delete via the in-memory path", async () => {
  __setTestDb(null)
  try {
    const c = await createConcern({ category: "Fire safety", description: "Extinguisher expired", action: "Replace" })
    assert.ok((await listConcerns()).some((x) => x.id === c.id))
    const adv = await advanceConcern(c.id)
    assert.equal(adv?.status, "under_review")
    assert.equal(await deleteConcern(c.id), true)
  } finally {
    __setTestDb(undefined)
  }
})
