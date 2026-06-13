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

// Student admission: documents verified by the Academic Head, then the Principal
// enrols and an APAAR id is minted. Two-level, two distinct roles.
export const ADMISSION_APPROVAL: WorkflowDef = {
  id: "admission-approval",
  name: "Student Admission",
  steps: [
    { id: "verify", name: "Document verification", approverRole: "ACADEMIC_HEAD" },
    { id: "enrol", name: "Enrolment & APAAR", approverRole: "PRINCIPAL" },
  ],
}

// Grievance redressal escalation: starts at the school (Principal); each tier can
// RESOLVE (close) or ESCALATE (approve → next tier): School → Block → District.
export const GRIEVANCE_ESCALATION: WorkflowDef = {
  id: "grievance-escalation",
  name: "Grievance Redressal",
  steps: [
    { id: "school", name: "School (Principal)", approverRole: "PRINCIPAL" },
    { id: "block", name: "Block (BEO)", approverRole: "BEO" },
    { id: "district", name: "District (DEO)", approverRole: "DEO" },
  ],
}

// Maintenance ticket: Principal triages & assigns → Vendor does the work →
// Principal verifies & closes. Role-gated closure (only the Principal closes).
export const MAINTENANCE_WORKFLOW: WorkflowDef = {
  id: "maintenance-workflow",
  name: "Maintenance Ticket",
  steps: [
    { id: "triage", name: "Triage & assign", approverRole: "PRINCIPAL" },
    { id: "work", name: "Vendor work", approverRole: "VENDOR" },
    { id: "close", name: "Verify & close", approverRole: "PRINCIPAL" },
  ],
}

// Governance forum / meeting (RACI): the convener (Secretary, Responsible) tables
// and adopts the agenda; the member body (Directors, Consulted) deliberates and adopts
// the resolution by quorum; for significant items the chair (Minister, Accountable)
// ratifies — dynamic routing skips ratification for routine business. Mirrors the
// FORUMS + RACI matrix in lib/governance-framework, run as a real, audited process.
export const FORUM_RESOLUTION: WorkflowDef = {
  id: "forum-resolution",
  name: "Governance Forum Resolution",
  steps: [
    { id: "agenda", name: "Convene & adopt agenda (Secretary)", approverRole: "SECRETARY" },
    { id: "deliberate", name: "Member adoption (quorum)", approverRole: "DIRECTOR", quorum: 2 },
    {
      id: "ratify",
      name: "Chair ratification (Minister)",
      approverRole: "MINISTER",
      skipIf: (ctx) => !ctx.requiresMinister,
    },
  ],
}

// Scholarship / benefit sanction (Schemes & Welfare): a student's benefit application is
// verified by the Headmaster, sanctioned by the BEO (block tier), and released as a DBT by
// the District (treasury). Dynamic routing: high-value sanctions (≥ ₹25,000) additionally
// require the DEO before release. Bottom-to-top approval that ends in a benefit disbursement.
export const SCHOLARSHIP_SANCTION: WorkflowDef = {
  id: "scholarship-sanction",
  name: "Scholarship / Benefit Sanction",
  steps: [
    { id: "verify", name: "Headmaster verification", approverRole: "PRINCIPAL" },
    { id: "sanction", name: "Block sanction (BEO)", approverRole: "BEO" },
    {
      id: "scrutiny",
      name: "District scrutiny (DEO)",
      approverRole: "DEO",
      skipIf: (ctx) => Number(ctx.amount ?? 0) < 25000,
    },
    { id: "release", name: "DBT release (Treasury)", approverRole: "DEO" },
  ],
}

export const WORKFLOW_DEFS: WorkflowDef[] = [
  LEAVE_APPROVAL,
  SMC_RESOLUTION,
  RECOGNITION_APPROVAL,
  ADMISSION_APPROVAL,
  GRIEVANCE_ESCALATION,
  MAINTENANCE_WORKFLOW,
  FORUM_RESOLUTION,
  SCHOLARSHIP_SANCTION,
]
