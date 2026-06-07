// VASA-EOS(SE) — reference workflow definitions wired to the engine.
// These show the three approval shapes government processes need: single-approver,
// multi-approver (quorum), and dynamic (context-conditional) routing.

import type { WorkflowDef } from "./index"

// Teacher leave: the HM always approves; long leave (> 5 days) ALSO needs the BEO
// (dynamic routing); very long leave (> 15 days) additionally needs the DEO.
export const LEAVE_APPROVAL: WorkflowDef = {
  id: "leave-approval",
  name: "Teacher Leave Approval",
  steps: [
    { id: "hm", name: "Headmaster / Principal", approverRole: "PRINCIPAL" },
    {
      id: "beo",
      name: "Block Education Officer",
      approverRole: "BEO",
      skipIf: (ctx) => Number(ctx.days ?? 0) <= 5,
    },
    {
      id: "deo",
      name: "District Education Officer",
      approverRole: "DEO",
      skipIf: (ctx) => Number(ctx.days ?? 0) <= 15,
    },
  ],
}

// School Management Committee resolution: needs a quorum of 3 member approvals,
// then the Principal countersigns (single). Demonstrates multiple approvers.
export const SMC_RESOLUTION: WorkflowDef = {
  id: "smc-resolution",
  name: "SMC Resolution",
  steps: [
    { id: "members", name: "SMC Members (quorum)", approverRole: "PARENT", quorum: 3 },
    { id: "chair", name: "Principal (counter-sign)", approverRole: "PRINCIPAL" },
  ],
}

// School recognition (TN 1973): BEO → DEO → Director. Three-level sequential.
export const RECOGNITION_APPROVAL: WorkflowDef = {
  id: "recognition-approval",
  name: "School Recognition (TN 1973)",
  steps: [
    { id: "beo", name: "Block verification", approverRole: "BEO" },
    { id: "deo", name: "District scrutiny", approverRole: "DEO" },
    { id: "dir", name: "Directorate sanction", approverRole: "DIRECTOR" },
  ],
}

export const WORKFLOW_DEFS: WorkflowDef[] = [LEAVE_APPROVAL, SMC_RESOLUTION, RECOGNITION_APPROVAL]
