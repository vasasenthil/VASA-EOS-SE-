import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { createConcern, advanceConcern, getConcern, deleteConcern, listConcerns } from "@/lib/safety/store"
import { scopeRecords, SCOPE_TENANTS, DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"

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

test("safety store: persists tenantId and defaults it when omitted (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  try {
    const tagged = await createConcern({ category: "Fire safety", description: "d", action: "a", tenantId: "TN-CBE" })
    assert.equal((await getConcern(tagged.id))?.tenantId, "TN-CBE")
    const untagged = await createConcern({ category: "Fire safety", description: "d", action: "a" })
    assert.equal((await getConcern(untagged.id))?.tenantId, DEFAULT_SCHOOL_NODE)
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

test("safety store: seeded concerns are scopable by jurisdiction (reference wiring)", async () => {
  __setTestDb(null) // in-memory seed has concerns across 4 tenant nodes
  try {
    const all = await listConcerns()
    // The State node sees every seeded school concern.
    assert.ok(scopeRecords(SCOPE_TENANTS, "TN", all).length >= 4)
    // Chennai district sees its 3 schools, not Coimbatore's.
    const chennai = scopeRecords(SCOPE_TENANTS, "TN-CHN", all)
    assert.ok(chennai.length >= 3)
    assert.ok(!chennai.some((c) => c.tenantId === "TN-CBE-B1-S1"))
    // A single school sees only its own.
    assert.ok(scopeRecords(SCOPE_TENANTS, "TN-CHN-B2-S1", all).every((c) => c.tenantId === "TN-CHN-B2-S1"))
  } finally {
    __setTestDb(undefined)
  }
})
