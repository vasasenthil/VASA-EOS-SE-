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

// RBSK child-health referral (Health, Safety & Welfare): a school health screening flags a
// condition (the RBSK "4 Ds"); the Headmaster verifies and forwards; the Block Medical Officer
// reviews; cases needing specialist care escalate to the District Early-Intervention Centre
// (DEIC). Dynamic: non-referral cases close at the block (the DEIC step is skipped).
export const HEALTH_REFERRAL: WorkflowDef = {
  id: "health-referral",
  name: "RBSK Health Referral",
  steps: [
    { id: "verify", name: "School verification (Headmaster)", approverRole: "PRINCIPAL" },
    { id: "bmo", name: "Block Medical Officer review", approverRole: "BEO" },
    {
      id: "deic",
      name: "District Early-Intervention (DEIC) specialist",
      approverRole: "DEO",
      skipIf: (ctx) => !ctx.specialistReferral,
    },
  ],
}

// Teacher transfer & counselling (Roles & Hierarchy / Staff): a teacher's transfer request is
// cleared by the Headmaster (relieving NOC), recommended by the BEO, and counselled/ordered by
// the District (DEO); inter-district transfers additionally need Directorate sanction (dynamic).
export const TRANSFER_REQUEST: WorkflowDef = {
  id: "transfer-request",
  name: "Teacher Transfer Request",
  steps: [
    { id: "noc", name: "Headmaster relieving NOC", approverRole: "PRINCIPAL" },
    { id: "recommend", name: "Block recommendation (BEO)", approverRole: "BEO" },
    { id: "counsel", name: "District counselling & order (DEO)", approverRole: "DEO" },
    {
      id: "sanction",
      name: "Directorate sanction (inter-district)",
      approverRole: "DIRECTOR",
      skipIf: (ctx) => !ctx.interDistrict,
    },
  ],
}

// Infrastructure works sanction (Infrastructure & Records): a school's civil-works proposal
// (new classroom, toilet block, ramp, drinking water…) is estimated by the Headmaster,
// technically scrutinised at the block, sanctioned at the district, and — for high-value works
// (≥ ₹10 lakh) — approved by the Directorate. Capital works under Samagra Shiksha / PM SHRI.
export const INFRA_WORKS: WorkflowDef = {
  id: "infra-works",
  name: "Infrastructure Works Sanction",
  steps: [
    { id: "propose", name: "Headmaster proposal & estimate", approverRole: "PRINCIPAL" },
    { id: "technical", name: "Block technical scrutiny (AE)", approverRole: "BEO" },
    { id: "district", name: "District sanction (EE / DEO)", approverRole: "DEO" },
    {
      id: "state",
      name: "Directorate approval (high-value)",
      approverRole: "DIRECTOR",
      skipIf: (ctx) => Number(ctx.cost ?? 0) < 1000000,
    },
  ],
}

// Child-safety incident escalation (Health, Safety & Welfare): a reported incident is verified
// by the Headmaster (who makes any mandatory CWC/Police report), reviewed at the block, and —
// for mandatory-report or high-severity cases — escalated to the District Child Protection Unit.
// POCSO confidentiality: NO victim identity is captured; cases use an anonymised reference.
export const SAFETY_INCIDENT: WorkflowDef = {
  id: "safety-incident",
  name: "Child-Safety Incident",
  steps: [
    { id: "verify", name: "School verification & mandatory report (Headmaster)", approverRole: "PRINCIPAL" },
    { id: "block", name: "Block safety review (BEO)", approverRole: "BEO" },
    {
      id: "dcpu",
      name: "District Child Protection Unit (DCPU)",
      approverRole: "DEO",
      skipIf: (ctx) => !ctx.escalate,
    },
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
  HEALTH_REFERRAL,
  TRANSFER_REQUEST,
  INFRA_WORKS,
  SAFETY_INCIDENT,
]
