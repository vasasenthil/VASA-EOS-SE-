import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { addEntitlement, advanceDistribution, deleteDistribution, listDistribution } from "@/lib/distribution/store"
import { recordMovement, deleteMovement, listMovements } from "@/lib/stock/store"
import { deriveStock } from "@/lib/stock"
import { issueCertificate, deleteCertificate, listCertificates } from "@/lib/certificates/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("distribution: add + advance entitled->issued->acknowledged (DB path)", async () => {
  const r = await addEntitlement({ student: "Aarthi", item: "Bicycle (Cl.11)" })
  assert.equal(r.status, "entitled")
  assert.equal((await advanceDistribution(r.id))?.status, "issued")
  assert.equal((await advanceDistribution(r.id))?.status, "acknowledged")
  assert.ok((await listDistribution()).some((x) => x.id === r.id))
  assert.equal(await deleteDistribution(r.id), true)
})

test("stock: record movements, derive net stock, delete (DB path)", async () => {
  const m1 = await recordMovement({ item: "Notebooks", type: "issue", qty: 10, at: "2026-06-05" })
  await recordMovement({ item: "Notebooks", type: "receive", qty: 30, at: "2026-06-06" })
  const moves = await listMovements()
  const stock = deriveStock({ Notebooks: 100 }, moves)
  assert.equal(stock.Notebooks, 120) // 100 - 10 + 30
  assert.equal(await deleteMovement(m1.id), true)
  assert.equal(await deleteMovement("missing"), false)
})

test("certificates: issue with sequential ref per type, list, delete (DB path)", async () => {
  const a = await issueCertificate({ type: "transfer", studentApaar: "AP-1", studentName: "A" })
  const b = await issueCertificate({ type: "transfer", studentApaar: "AP-2", studentName: "B" })
  assert.match(a.ref, /^TC\/\d{4}\/000001$/)
  assert.match(b.ref, /^TC\/\d{4}\/000002$/)
  const c = await issueCertificate({ type: "bonafide", studentApaar: "AP-3", studentName: "C" })
  assert.match(c.ref, /^BC\/\d{4}\/000001$/) // independent sequence per type
  assert.ok((await listCertificates()).length >= 3)
  assert.equal(await deleteCertificate(a.id), true)
})

test("in-memory fallback works for all three", async () => {
  __setTestDb(null)
  assert.ok((await listDistribution()).length >= 1) // seeded roster
  const m = await recordMovement({ item: "Uniform", type: "issue", qty: 5, at: "2026-06-07" })
  assert.ok((await listMovements()).some((x) => x.id === m.id))
  const cert = await issueCertificate({ type: "conduct", studentApaar: "AP-9", studentName: "Z" })
  assert.match(cert.ref, /^CC\//)
})
