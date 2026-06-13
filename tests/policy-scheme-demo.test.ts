import { test } from "node:test"
import assert from "node:assert/strict"
import { policyDemoData } from "@/lib/policy/demo"
import { schemeDemoData } from "@/lib/schemes/demo"

test("policy demo data is a non-trivial set of complete drafts", () => {
  const ps = policyDemoData()
  assert.ok(ps.length >= 5)
  for (const p of ps) {
    assert.ok(p.id && p.title && p.policyDomain && p.version, `incomplete policy ${p.title}`)
    assert.ok(p.abstractEN.length > 10)
    assert.ok(Array.isArray(p.nepThrustAreas) && p.nepThrustAreas.length >= 1)
  }
  assert.equal(new Set(ps.map((p) => p.id)).size, ps.length) // unique ids
})

test("scheme demo data is a non-trivial set of active TN schemes", () => {
  const ss = schemeDemoData()
  assert.ok(ss.length >= 5)
  for (const s of ss) {
    assert.ok(s.id && s.name && s.status, `incomplete scheme ${s.name}`)
    assert.ok(Array.isArray(s.documents))
  }
  assert.ok(ss.some((s) => /Pudhumai Penn/.test(s.name)))
  assert.ok(ss.some((s) => /Breakfast/.test(s.name)))
  assert.equal(new Set(ss.map((s) => s.id)).size, ss.length)
})
