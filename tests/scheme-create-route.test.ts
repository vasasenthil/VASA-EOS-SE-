import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/db"
import { createScheme, getScheme } from "@/lib/stores/scheme-store"
import { resetMemoryOutbox } from "@/lib/events/outbox-publisher"
import { makeFakeDb } from "./helpers/fake-db"
import { schemeProposalFromFormData, schemeCreationErrorMessage } from "@/lib/schemes/create-form"

const repoRoot = process.cwd()

test("/schemes/create is a real static route, not captured as a scheme id", () => {
  const createPage = join(repoRoot, "app/schemes/create/page.tsx")
  assert.equal(existsSync(createPage), true)
  const detailPage = readFileSync(join(repoRoot, "app/schemes/[schemeId]/page.tsx"), "utf8")
  assert.match(detailPage, /Scheme not found/)
  assert.ok(readFileSync(createPage, "utf8").includes("createSchemeFormAction"))
})

test("scheme create form maps browser fields to the durable scheme proposal schema", () => {
  const fd = new FormData()
  fd.set("name", "District Digital Learning Labs")
  fd.set("description", "Digital labs for government schools with device access.")
  fd.set("category", "digital_learning")
  fd.set("eligibility", "Government schools with ICT gaps")
  fd.set("budget", "600000000")
  fd.set("fiscalYear", "2026-27")
  fd.set("justification", "Improves digital access and safe classroom remediation.")
  fd.set("expectedOutcomes", "Raise digital lesson usage\nImprove FLN practice time")
  fd.set("milestoneName", "Pilot launch")
  fd.set("milestoneDueDate", "2026-09-01")

  const proposal = schemeProposalFromFormData(fd, "secretary@tn.gov")
  assert.equal(proposal.category, "digital_learning")
  assert.equal(proposal.budget, 600000000)
  assert.deepEqual(proposal.expectedOutcomes, ["Raise digital lesson usage", "Improve FLN practice time"])
  assert.equal(proposal.timeline.milestones[0].name, "Pilot launch")
})

test("scheme create errors explain durable DB setup instead of sending users to not-found", () => {
  assert.match(schemeCreationErrorMessage(new Error("Database required for durable store operation")), /durable scheme database/i)
})


test("scheme create form output can be persisted and reloaded from the durable scheme store", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  resetMemoryOutbox()
  const fd = new FormData()
  fd.set("name", "District Digital Learning Labs")
  fd.set("description", "Digital labs for government schools with device access.")
  fd.set("category", "digital_learning")
  fd.set("eligibility", "Government schools with ICT gaps")
  fd.set("budget", "600000000")
  fd.set("fiscalYear", "2026-27")
  fd.set("justification", "Improves digital access and safe classroom remediation.")
  fd.set("expectedOutcomes", "Raise digital lesson usage")

  try {
    const created = await createScheme(schemeProposalFromFormData(fd, "secretary@tn.gov"))
    assert.equal((await getScheme(created.id))?.name, "District Digital Learning Labs")
  } finally {
    __setTestDb(undefined)
  }
})
