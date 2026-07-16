import { WORKFLOW_RUNTIME_DEFINITIONS, workflowDefinitionSchema } from "@/lib/workflow-runtime/schema"

export const SCHEME_CABINET_THRESHOLD = 500_000_000

export const SCHEME_APPROVAL_WORKFLOW = workflowDefinitionSchema.parse({
  workflowType: "scheme-approval",
  steps: [
    { stepName: "Secretary Review", requiredRole: "SECRETARY", slaDurationSeconds: 3 * 24 * 60 * 60, compensateAction: "notify-stakeholders-of-rejection" },
    { stepName: "Minister Approval", requiredRole: "MINISTER", slaDurationSeconds: 5 * 24 * 60 * 60, compensateAction: "notify-stakeholders-of-rejection" },
    { stepName: "Cabinet Note", requiredRole: "CABINET", slaDurationSeconds: 7 * 24 * 60 * 60, compensateAction: "notify-stakeholders-of-rejection" },
    { stepName: "Budget Allocation", requiredRole: "SYSTEM", slaDurationSeconds: 24 * 60 * 60, compensateAction: "reverse-budget-allocation" },
    { stepName: "Scheme Activation", requiredRole: "SYSTEM", slaDurationSeconds: 24 * 60 * 60, compensateAction: "notify-stakeholders-of-rejection" },
  ],
})

WORKFLOW_RUNTIME_DEFINITIONS.set(SCHEME_APPROVAL_WORKFLOW.workflowType, SCHEME_APPROVAL_WORKFLOW)

export function registerSchemeWorkflow(): void {
  WORKFLOW_RUNTIME_DEFINITIONS.set(SCHEME_APPROVAL_WORKFLOW.workflowType, SCHEME_APPROVAL_WORKFLOW)
}
