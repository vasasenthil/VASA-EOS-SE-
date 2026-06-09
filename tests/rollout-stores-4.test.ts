import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"

import { createDrill, getDrill, deleteDrill, listDrills } from "@/lib/drills/store"
import { createEntry, getEntry, deleteEntry, listEntries } from "@/lib/competitions/store"
import { createTrip, addConsent, getTrip, deleteTrip, listTrips } from "@/lib/excursions/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("drills: create, get, list, delete via the DB path", async () => {
  const d = await createDrill({ type: "Fire", date: "2026-06-05", evacTimeSec: 180, participants: 200, observations: "Stairwell B slow" })
  assert.equal((await getDrill(d.id))?.evacTimeSec, 180)
  assert.ok((await listDrills()).some((x) => x.id === d.id))
  assert.equal(await deleteDrill(d.id), true)
  assert.equal(await getDrill(d.id), undefined)
})

test("competitions: record, get, list, delete via the DB path", async () => {
  const e = await createEntry({ student: "Aarthi", event: "Maths Olympiad", level: "District", medal: "Gold" })
  assert.equal((await getEntry(e.id))?.medal, "Gold")
  assert.ok((await listEntries()).some((x) => x.id === e.id))
  assert.equal(await deleteEntry(e.id), true)
})

test("excursions: plan, add consent (capped at strength), delete via the DB path", async () => {
  const t = await createTrip({ destination: "Museum", date: "2026-07-01", classGroup: "6-8", strength: 2 })
  assert.equal(t.consentsReceived, 0)
  assert.equal((await addConsent(t.id))?.consentsReceived, 1)
  assert.equal((await addConsent(t.id))?.consentsReceived, 2)
  assert.equal((await addConsent(t.id))?.consentsReceived, 2) // capped at strength
  assert.ok((await listTrips()).some((x) => x.id === t.id))
  assert.equal(await deleteTrip(t.id), true)
  assert.equal(await addConsent("missing"), undefined)
})

test("in-memory fallback works for all three when no DB is configured", async () => {
  __setTestDb(null)
  const d = await createDrill({ type: "Earthquake", date: "2026-06-05", evacTimeSec: 300, participants: 100, observations: "" })
  assert.ok((await listDrills()).some((x) => x.id === d.id))
  const e = await createEntry({ student: "B", event: "Quiz", level: "School", medal: "Participation" })
  assert.ok((await listEntries()).some((x) => x.id === e.id))
  const t = await createTrip({ destination: "Park", date: "2026-07-02", classGroup: "1-5", strength: 1 })
  assert.equal((await addConsent(t.id))?.consentsReceived, 1)
  assert.equal(await deleteDrill(d.id), true)
})
