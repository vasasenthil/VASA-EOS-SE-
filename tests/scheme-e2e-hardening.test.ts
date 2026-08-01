import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/db"
import { resetMemoryOutbox } from "@/lib/events/outbox-publisher"
import { createScheme, getScheme, updateScheme } from "@/lib/stores/scheme-store"
import { proposeScheme, approveSchemeStep } from "@/lib/stores/scheme-approval-store"
import { getWorkflowInstance, resetWorkflowRuntimeStore } from "@/lib/workflow-runtime/store"
import { schemeProposalFromFormData, schemeUpdatesFromFormData } from "@/lib/schemes/create-form"
import { makeFakeDb } from "./helpers/fake-db"

function form(name = "Statewide Foundational Literacy Labs", budget = "750000000"): FormData {
  const fd = new FormData()
  fd.set("name", name)
  fd.set("description", "Statewide scheme to create foundational literacy and numeracy labs in government schools.")
  fd.set("category", "digital_learning")
  fd.set("eligibility", "Government and aided schools with FLN gaps")
  fd.set("budget", budget)
  fd.set("fiscalYear", "2026-27")
  fd.set("milestoneName", "District readiness validation")
  fd.set("milestoneDueDate", "2026-09-30")
  fd.set("justification", "Closes foundational learning gaps with auditable school-level deployment.")
  fd.set("expectedOutcomes", "Improve FLN outcomes\nReduce remedial backlog")
  return fd
}

test("scheme UI lifecycle is durable from create to detail reload, edit, workflow propose and approval", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  resetWorkflowRuntimeStore()
  resetMemoryOutbox()
  try {
    const created = await createScheme(schemeProposalFromFormData(form(), "secretary@tn.gov"))
    assert.equal((await getScheme(created.id))?.name, "Statewide Foundational Literacy Labs")

    const updated = await updateScheme(created.id, schemeUpdatesFromFormData(form("Statewide FLN Labs", "760000000")))
    assert.equal(updated.name, "Statewide FLN Labs")
    assert.equal((await getScheme(created.id))?.budget, 760000000)

    await proposeScheme(created.id, "SECRETARY")
    const proposed = await getScheme(created.id)
    assert.equal(proposed?.status, "under_review")
    assert.ok(proposed?.workflowId)
    assert.ok(await getWorkflowInstance(proposed!.workflowId!))

    for (let step = 0; step <= 4; step++) await approveSchemeStep(proposed!.workflowId!, step, step === 0 ? "SECRETARY" : step === 1 ? "MINISTER" : "SYSTEM", `approved-${step}`)
    assert.equal((await getScheme(created.id))?.status, "approved")
  } finally {
    __setTestDb(undefined)
    resetWorkflowRuntimeStore()
  }
})
