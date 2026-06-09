import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"

import { createChild, advanceChild, getChild, deleteChild, listChildren } from "@/lib/oosc/store"
import { createTest, getTest, deleteTest, listTests } from "@/lib/water/store"
import { createCamera, setCameraWorking, getCamera, deleteCamera, listCameras } from "@/lib/cctv/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("oosc: identify, advance to mainstreamed, delete via the DB path", async () => {
  const c = await createChild({ name: "Ravi", age: 10, reason: "Migration", targetClass: "4" })
  assert.equal(c.status, "identified")
  assert.equal((await advanceChild(c.id))?.status, "enrolled")
  assert.equal((await advanceChild(c.id))?.status, "bridging")
  assert.equal((await advanceChild(c.id))?.status, "mainstreamed")
  assert.equal((await getChild(c.id))?.status, "mainstreamed")
  assert.ok((await listChildren()).some((x) => x.id === c.id))
  assert.equal(await deleteChild(c.id), true)
  assert.equal(await advanceChild("missing"), undefined)
})

test("water: result is derived server-side from pH; list + delete via the DB path", async () => {
  const safe = await createTest({ source: "RO / purifier unit", date: "2026-06-05", ph: 7.2, remarks: "" })
  assert.equal(safe.result, "safe")
  const unsafe = await createTest({ source: "Borewell", date: "2026-06-05", ph: 9.4, remarks: "high" })
  assert.equal(unsafe.result, "unsafe")
  assert.equal((await getTest(safe.id))?.result, "safe")
  assert.equal((await listTests()).length, 2)
  assert.equal(await deleteTest(safe.id), true)
  assert.equal(await getTest(safe.id), undefined)
})

test("cctv: register, toggle working, delete via the DB path", async () => {
  const cam = await createCamera({ location: "Gate dome", zone: "Main gate" })
  assert.equal(cam.working, true)
  assert.equal((await setCameraWorking(cam.id, false))?.working, false)
  assert.equal((await getCamera(cam.id))?.working, false)
  assert.ok((await listCameras()).some((x) => x.id === cam.id))
  assert.equal(await deleteCamera(cam.id), true)
  assert.equal(await setCameraWorking("missing", true), undefined)
})

test("in-memory fallback works for all three when no DB is configured", async () => {
  __setTestDb(null)
  const c = await createChild({ name: "N", age: 8, reason: "Never enrolled", targetClass: "3" })
  assert.equal((await advanceChild(c.id))?.status, "enrolled")
  const t = await createTest({ source: "Hand pump", date: "2026-06-05", ph: 5.5, remarks: "" })
  assert.equal(t.result, "unsafe")
  const cam = await createCamera({ location: "Lab", zone: "Laboratory" })
  assert.equal((await setCameraWorking(cam.id, false))?.working, false)
  assert.ok((await listChildren()).some((x) => x.id === c.id))
})
