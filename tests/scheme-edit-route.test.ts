import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/db"
import { createScheme, getScheme, updateScheme } from "@/lib/stores/scheme-store"
import { resetMemoryOutbox } from "@/lib/events/outbox-publisher"
import { makeFakeDb } from "./helpers/fake-db"
import { schemeProposalFromFormData, schemeUpdatesFromFormData } from "@/lib/schemes/create-form"

const repoRoot = process.cwd()

function form(name = "District Digital Learning Labs"): FormData {
  const fd = new FormData()
  fd.set("name", name)
  fd.set("description", "Digital labs for government schools with device access.")
  fd.set("category", "digital_learning")
  fd.set("eligibility", "Government schools with ICT gaps")
  fd.set("budget", "600000000")
  fd.set("fiscalYear", "2026-27")
  fd.set("justification", "Improves digital access and safe classroom remediation.")
  fd.set("expectedOutcomes", "Raise digital lesson usage")
  return fd
}

test("/schemes/edit/[schemeId] exists for the detail page Edit Scheme link", () => {
  const editPage = join(repoRoot, "app/schemes/edit/[schemeId]/page.tsx")
  assert.equal(existsSync(editPage), true)
  assert.match(readFileSync(join(repoRoot, "app/schemes/[schemeId]/page.tsx"), "utf8"), /\/schemes\/edit\/\$\{schemeId\}/)
  assert.ok(readFileSync(editPage, "utf8").includes("updateSchemeFormAction"))
})

test("scheme edit form maps browser fields to durable scheme update fields", () => {
  const updates = schemeUpdatesFromFormData(form("Updated Digital Learning Labs"))
  assert.equal(updates.name, "Updated Digital Learning Labs")
  assert.equal(updates.category, "digital_learning")
  assert.equal(updates.expectedOutcomes[0], "Raise digital lesson usage")
})

test("scheme edit form output can update and reload a durable scheme", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  resetMemoryOutbox()
  try {
    const created = await createScheme(schemeProposalFromFormData(form(), "secretary@tn.gov"))
    await updateScheme(created.id, schemeUpdatesFromFormData(form("Updated Digital Learning Labs")))
    assert.equal((await getScheme(created.id))?.name, "Updated Digital Learning Labs")
  } finally {
    __setTestDb(undefined)
  }
})
