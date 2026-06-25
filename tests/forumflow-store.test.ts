import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { fileForum, actOnForum, getForum, deleteForum, listForums } from "@/lib/forumflow/store"
import { effectiveSteps } from "@/lib/workflow"
import { FORUM_RESOLUTION } from "@/lib/workflow/definitions"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("forum def: dynamic routing skips Minister ratification for routine items", () => {
  assert.equal(effectiveSteps(FORUM_RESOLUTION, { requiresMinister: true }).length, 3)
  assert.equal(effectiveSteps(FORUM_RESOLUTION, { requiresMinister: false }).length, 2)
})

test("routine resolution: Secretary adopts -> quorum of 2 Directors -> approved (no Minister)", async () => {
  const m = await fileForum({ forum: "Programme Management", title: "Sprint review", requiresMinister: false })
  assert.equal(m.instance.status, "in_progress")
  // A Director cannot adopt the agenda first — that step is the Secretary's.
  assert.equal((await actOnForum(m.id, { actorRole: "DIRECTOR", actor: "d", decision: "approve" })).ok, false)

  await actOnForum(m.id, { actorRole: "SECRETARY", actor: "Secy", decision: "approve" }) // agenda adopted
  let res = await actOnForum(m.id, { actorRole: "DIRECTOR", actor: "DSE", decision: "approve" }) // 1/2
  assert.equal(res.record?.instance.status, "in_progress")
  res = await actOnForum(m.id, { actorRole: "DIRECTOR", actor: "DEE", decision: "approve" }) // 2/2 -> done
  assert.equal(res.record?.instance.status, "approved")
})

test("significant resolution: also requires Minister ratification", async () => {
  const m = await fileForum({ forum: "State Steering Committee", title: "Budget", requiresMinister: true })
  await actOnForum(m.id, { actorRole: "SECRETARY", actor: "Secy", decision: "approve" })
  await actOnForum(m.id, { actorRole: "DIRECTOR", actor: "DSE", decision: "approve" })
  let res = await actOnForum(m.id, { actorRole: "DIRECTOR", actor: "DEE", decision: "approve" }) // quorum met
  assert.equal(res.record?.instance.status, "in_progress") // still needs the Minister
  // A Director cannot ratify in the Minister's place.
  assert.equal((await actOnForum(m.id, { actorRole: "DIRECTOR", actor: "d", decision: "approve" })).ok, false)
  res = await actOnForum(m.id, { actorRole: "MINISTER", actor: "CM", decision: "approve" })
  assert.equal(res.record?.instance.status, "approved")
})

test("reject at any tier terminates the resolution", async () => {
  const m = await fileForum({ forum: "AI Ethics Council", title: "Model policy", requiresMinister: false })
  const res = await actOnForum(m.id, { actorRole: "SECRETARY", actor: "Secy", decision: "reject" })
  assert.equal(res.record?.instance.status, "rejected")
})

test("persists action items; get/list/delete round-trip", async () => {
  const m = await fileForum({
    forum: "Executive Steering",
    title: "Vendor onboarding",
    requiresMinister: false,
    actionItems: ["Publish RFP", "Notify districts"],
  })
  const got = await getForum(m.id)
  assert.deepEqual(got?.actionItems, ["Publish RFP", "Notify districts"])
  assert.ok((await listForums()).some((x) => x.id === m.id))
  assert.equal(await deleteForum(m.id), true)
  assert.equal(await getForum(m.id), undefined)
})

test("in-memory mode is seeded so oversight has data without a DB", async () => {
  __setTestDb(null)
  const seeded = await listForums()
  assert.ok(seeded.length >= 2)
  assert.ok(seeded.some((r) => r.requiresMinister))
})
