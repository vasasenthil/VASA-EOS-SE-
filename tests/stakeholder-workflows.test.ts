import { test } from "node:test"
import assert from "node:assert/strict"
import { PORTALS, type PortalRole } from "@/config/portals"
import { WORKFLOW_DEFS } from "@/lib/workflow/definitions"
import {
  stakeholderWorkflowLanes,
  stakeholderWorkflowSummary,
  workflowsForStakeholder,
  WORKFLOW_STAKEHOLDER_ROUTES,
} from "@/lib/workflow/stakeholders"

test("every workflow definition is routed into the per-stakeholder matrix", () => {
  const routed = new Set(WORKFLOW_STAKEHOLDER_ROUTES.map((route) => route.workflowId))
  assert.deepEqual(
    WORKFLOW_DEFS.map((def) => def.id).filter((id) => !routed.has(id)),
    [],
  )
})

test("every stakeholder portal has at least one dynamic workflow lane", () => {
  for (const role of Object.keys(PORTALS) as PortalRole[]) {
    assert.ok(workflowsForStakeholder(role).length > 0, `missing workflow lane for ${role}`)
  }
})

test("approver lanes are derived from workflow step roles", () => {
  const lanes = stakeholderWorkflowLanes()
  for (const def of WORKFLOW_DEFS) {
    for (const step of def.steps) {
      assert.ok(
        lanes.some((lane) => lane.workflowId === def.id && lane.role === step.approverRole && lane.actions.includes("approve")),
        `missing approver lane for ${def.id}:${step.approverRole}`,
      )
    }
  }
})

test("summary proves full stakeholder and workflow coverage", () => {
  const summary = stakeholderWorkflowSummary()
  assert.equal(summary.rolesCovered, summary.roles)
  assert.equal(summary.workflowsCovered, summary.workflows)
  assert.ok(summary.dynamicWorkflows >= 8)
  assert.ok(summary.initiateLanes > 0)
  assert.ok(summary.approveLanes > 0)
  assert.ok(summary.observeLanes > 0)
})
