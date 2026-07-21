// VASA-EOS(SE) — dynamic per-stakeholder workflow map.
//
// The workflow engine already owns routing and role-gated approval. This module
// projects those definitions across every stakeholder portal so each role gets a
// live workflow lane: initiate, approve, or observe. It is deliberately derived
// from WORKFLOW_DEFS + PORTALS so new workflows/roles fail tests until routed.

import { PORTALS, type PortalRole } from "@/config/portals"
import { effectiveSteps, type WorkflowDef } from "@/lib/workflow"
import { WORKFLOW_DEFS } from "@/lib/workflow/definitions"

export type StakeholderWorkflowAction = "initiate" | "approve" | "observe"

export interface WorkflowStakeholderRoute {
  workflowId: string
  /** Stakeholders who can file/start this workflow from their portal. */
  initiatorRoles: PortalRole[]
  /** Stakeholders who need line-of-sight even when they do not act on the current step. */
  observerRoles: PortalRole[]
  /** Typical high-route context used to expose conditional/dynamic steps. */
  sampleContext?: Record<string, unknown>
}

export interface StakeholderWorkflowLane {
  role: PortalRole
  roleLabel: string
  tier: string
  workflowId: string
  workflowName: string
  actions: StakeholderWorkflowAction[]
  approverSteps: string[]
  dynamicSteps: string[]
}

export interface StakeholderWorkflowSummary {
  roles: number
  workflows: number
  lanes: number
  initiateLanes: number
  approveLanes: number
  observeLanes: number
  rolesCovered: number
  workflowsCovered: number
  dynamicWorkflows: number
}

export const WORKFLOW_STAKEHOLDER_ROUTES: WorkflowStakeholderRoute[] = [
  { workflowId: "leave-approval", initiatorRoles: ["TEACHER"], observerRoles: ["PRINCIPAL", "BEO", "DEO"], sampleContext: { days: 20 } },
  { workflowId: "smc-resolution", initiatorRoles: ["PARENT", "PRINCIPAL"], observerRoles: ["TEACHER", "BEO"], sampleContext: {} },
  { workflowId: "recognition-approval", initiatorRoles: ["PUBLIC", "INSTITUTION_HEAD"], observerRoles: ["BEO", "DEO", "DIRECTOR", "SECRETARY"], sampleContext: {} },
  { workflowId: "admission-approval", initiatorRoles: ["PARENT", "PUBLIC", "ACADEMIC_HEAD"], observerRoles: ["STUDENT", "PRINCIPAL", "SUBJECT_INCHARGE"], sampleContext: {} },
  { workflowId: "grievance-escalation", initiatorRoles: ["STUDENT", "PARENT", "TEACHER", "PUBLIC"], observerRoles: ["PRINCIPAL", "BEO", "DEO", "SECRETARY"], sampleContext: {} },
  { workflowId: "maintenance-workflow", initiatorRoles: ["TEACHER", "PRINCIPAL", "VENDOR"], observerRoles: ["BEO", "DEO"], sampleContext: {} },
  { workflowId: "forum-resolution", initiatorRoles: ["SECRETARY", "DIRECTOR"], observerRoles: ["MINISTER", "DEO", "BEO"], sampleContext: { requiresMinister: true } },
  { workflowId: "scholarship-sanction", initiatorRoles: ["STUDENT", "PARENT", "PRINCIPAL"], observerRoles: ["BEO", "DEO", "SECRETARY"], sampleContext: { amount: 25000 } },
  { workflowId: "health-referral", initiatorRoles: ["TEACHER", "PRINCIPAL", "PARENT"], observerRoles: ["STUDENT", "BEO", "DEO"], sampleContext: { specialistReferral: true } },
  { workflowId: "transfer-request", initiatorRoles: ["TEACHER", "PRINCIPAL"], observerRoles: ["BEO", "DEO", "DIRECTOR"], sampleContext: { interDistrict: true } },
  { workflowId: "infra-works", initiatorRoles: ["PRINCIPAL", "CRCC"], observerRoles: ["BEO", "DEO", "DIRECTOR", "PUBLIC"], sampleContext: { cost: 1000000 } },
  { workflowId: "safety-incident", initiatorRoles: ["STUDENT", "PARENT", "TEACHER", "PRINCIPAL"], observerRoles: ["BEO", "DEO", "SECRETARY"], sampleContext: { escalate: true } },
  { workflowId: "rti-request", initiatorRoles: ["PUBLIC", "PARENT", "RESEARCHER"], observerRoles: ["BEO", "DEO", "SECRETARY", "MINISTER"], sampleContext: {} },
  { workflowId: "gem-procurement", initiatorRoles: ["PRINCIPAL", "VENDOR"], observerRoles: ["BEO", "DEO", "DIRECTOR", "SECRETARY"], sampleContext: { cost: 500000 } },
  { workflowId: "budget-sanction", initiatorRoles: ["DIRECTOR", "SECRETARY"], observerRoles: ["MINISTER", "ADMIN"], sampleContext: { needsCabinet: true } },
  { workflowId: "tc-issuance", initiatorRoles: ["STUDENT", "PARENT", "ACADEMIC_HEAD"], observerRoles: ["PRINCIPAL", "BEO", "DEO"], sampleContext: { needsCountersign: true } },
]

function routeFor(def: WorkflowDef): WorkflowStakeholderRoute {
  const route = WORKFLOW_STAKEHOLDER_ROUTES.find((r) => r.workflowId === def.id)
  if (!route) throw new Error(`No stakeholder route configured for workflow ${def.id}`)
  return route
}

function uniqueActions(actions: StakeholderWorkflowAction[]): StakeholderWorkflowAction[] {
  return [...new Set(actions)]
}

export function stakeholderWorkflowLanes(defs: WorkflowDef[] = WORKFLOW_DEFS): StakeholderWorkflowLane[] {
  const lanes: StakeholderWorkflowLane[] = []
  const roles = Object.keys(PORTALS) as PortalRole[]

  for (const def of defs) {
    const route = routeFor(def)
    const highRouteSteps = effectiveSteps(def, route.sampleContext ?? {})
    for (const role of roles) {
      const approverSteps = highRouteSteps.filter((step) => step.approverRole === role).map((step) => step.name)
      const actions = uniqueActions([
        ...(route.initiatorRoles.includes(role) ? ["initiate" as const] : []),
        ...(approverSteps.length > 0 ? ["approve" as const] : []),
        ...(route.observerRoles.includes(role) ? ["observe" as const] : []),
      ])

      if (actions.length === 0) continue

      lanes.push({
        role,
        roleLabel: PORTALS[role].label,
        tier: PORTALS[role].tier,
        workflowId: def.id,
        workflowName: def.name,
        actions,
        approverSteps,
        dynamicSteps: highRouteSteps.filter((step) => !!step.skipIf).map((step) => step.name),
      })
    }
  }

  return lanes.sort((a, b) => a.role.localeCompare(b.role) || a.workflowName.localeCompare(b.workflowName))
}

export function workflowsForStakeholder(role: PortalRole, defs: WorkflowDef[] = WORKFLOW_DEFS): StakeholderWorkflowLane[] {
  return stakeholderWorkflowLanes(defs).filter((lane) => lane.role === role)
}

export function stakeholderWorkflowSummary(defs: WorkflowDef[] = WORKFLOW_DEFS): StakeholderWorkflowSummary {
  const lanes = stakeholderWorkflowLanes(defs)
  return {
    roles: Object.keys(PORTALS).length,
    workflows: defs.length,
    lanes: lanes.length,
    initiateLanes: lanes.filter((lane) => lane.actions.includes("initiate")).length,
    approveLanes: lanes.filter((lane) => lane.actions.includes("approve")).length,
    observeLanes: lanes.filter((lane) => lane.actions.includes("observe")).length,
    rolesCovered: new Set(lanes.map((lane) => lane.role)).size,
    workflowsCovered: new Set(lanes.map((lane) => lane.workflowId)).size,
    dynamicWorkflows: defs.filter((def) => def.steps.some((step) => !!step.skipIf)).length,
  }
}
