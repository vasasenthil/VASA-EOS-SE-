// VASA-EOS(SE) — viewable demo snapshots for the durable modules.
//
// When the Go backbone isn't wired (no PLATFORM_URL — e.g. the hosted Vercel demo), the platform-client getters
// return these representative snapshots instead of null/[], so every module page renders its real dashboard,
// lists and forms with realistic content (marked "Demo data") rather than a blocking "Backbone not connected"
// alert. Values mirror the backbone's own seeds (TN-DIST-Chennai, synthetic SYN-… ids — never real PII). Writes
// still no-op in this mode; deploy the backbone (deploy/backbone) to make them persist.

import type {
  PlatformEstablishmentDashboard,
  PlatformAppointment,
  PlatformFeeDashboard,
  PlatformAttendanceDashboard,
  PlatformSMCDashboard,
  PlatformSMCMeeting,
  PlatformBonafideDashboard,
  PlatformBonafide,
  PlatformTeacherTransferDashboard,
  PlatformTeacherTransfer,
  PlatformAuditTrail,
  PlatformInspectionDashboard,
  PlatformTCDashboard,
  PlatformStaffAttendanceDashboard,
  PlatformGrantDashboard,
  PlatformLessonPlanDashboard,
  PlatformPeriodDashboard,
  PlatformPeriodAttendance,
  PlatformAdmissionDashboard,
  PlatformGrievanceCase,
  PlatformScholarshipDashboard,
  PlatformDisbursement,
  PlatformMdmDashboard,
  PlatformTransportDashboard,
  PlatformTransportAllotment,
  PlatformImmunisationDashboard,
  PlatformStudentImmunisation,
  PlatformEntitlementDashboard,
  PlatformTimetableDashboard,
  PlatformSlot,
  PlatformLibraryDashboard,
  PlatformInfraDashboard,
  PlatformTicket,
  PlatformPtmDashboard,
  PlatformPtmBooking,
  PlatformRbskDashboard,
  PlatformCpdDashboard,
  PlatformCalendarDashboard,
  PlatformCalendarEntry,
  PlatformExamDashboard,
  PlatformExamSheet,
  PlatformDirectorySummary,
  PlatformDirectoryUser,
} from "@/lib/platform-client"

const SCOPE = "TN-DIST-Chennai"

// ── Establishment & Posts ────────────────────────────────────────────────────────────────────────────────
export const demoEstablishmentDashboard: PlatformEstablishmentDashboard = {
  scope: SCOPE,
  cadres: 5,
  sanctioned: 18,
  filled: 15,
  vacant: 3,
  vacancy_pct: 16.7,
  strength: [
    { establishment_id: "ESTAB-CHN-01", cadre: "Headmaster", sanctioned: 1, filled: 1, vacant: 0, vacancy_pct: 0 },
    { establishment_id: "ESTAB-CHN-02", cadre: "Graduate Teacher (BT)", sanctioned: 8, filled: 7, vacant: 1, vacancy_pct: 12.5 },
    { establishment_id: "ESTAB-CHN-03", cadre: "Secondary Grade Teacher", sanctioned: 6, filled: 6, vacant: 0, vacancy_pct: 0 },
    { establishment_id: "ESTAB-CHN-04", cadre: "Physical Education Teacher", sanctioned: 1, filled: 0, vacant: 1, vacancy_pct: 100 },
    { establishment_id: "ESTAB-CHN-05", cadre: "Office Assistant", sanctioned: 2, filled: 1, vacant: 1, vacancy_pct: 50 },
  ],
  vacancies: [
    { establishment_id: "ESTAB-CHN-02", cadre: "Graduate Teacher (BT)", sanctioned: 8, filled: 7, vacant: 1, vacancy_pct: 12.5 },
    { establishment_id: "ESTAB-CHN-04", cadre: "Physical Education Teacher", sanctioned: 1, filled: 0, vacant: 1, vacancy_pct: 100 },
    { establishment_id: "ESTAB-CHN-05", cadre: "Office Assistant", sanctioned: 2, filled: 1, vacant: 1, vacancy_pct: 50 },
  ],
  synthetic: true,
}

export function demoEstablishmentRoster(establishmentId: string): PlatformAppointment[] {
  const counts: Record<string, number> = {
    "ESTAB-CHN-01": 1, "ESTAB-CHN-02": 7, "ESTAB-CHN-03": 6, "ESTAB-CHN-04": 0, "ESTAB-CHN-05": 1,
  }
  const n = counts[establishmentId] ?? 0
  return Array.from({ length: n }, (_, i) => ({
    id: `${establishmentId}-APPT-${String(i + 1).padStart(2, "0")}`,
    establishment_id: establishmentId,
    org_unit: "33030004181",
    employee_id: `SYN-T-${String(i + 1).padStart(3, "0")}`,
    name: `Staff SYN-T-${String(i + 1).padStart(3, "0")}`,
    status: "filled",
    appointed_on: "2024-06-01",
  }))
}

// ── Fee & Finance Ledger (money in paise) ────────────────────────────────────────────────────────────────
export const demoFeeDashboard: PlatformFeeDashboard = {
  scope: SCOPE,
  as_of: "2026-06-25",
  demands: 24,
  demanded_paise: 4_80_000_00,
  collected_paise: 3_96_000_00,
  outstanding_paise: 72_000_00,
  waived_paise: 12_000_00,
  collection_pct: 82.5,
  by_status: { paid: 18, partial: 4, outstanding: 2 },
  defaulters: [
    { demand_id: "FEE-CHN-019", student_id: "SYN-S-CHN-019", category: "BC", outstanding_paise: 4_500_00, due_on: "2026-06-15" },
    { demand_id: "FEE-CHN-022", student_id: "SYN-S-CHN-022", category: "MBC", outstanding_paise: 3_000_00, due_on: "2026-06-20" },
  ],
  synthetic: true,
}

// ── Student Attendance ───────────────────────────────────────────────────────────────────────────────────
export const demoAttendanceDashboard: PlatformAttendanceDashboard = {
  scope: SCOPE,
  date: "2026-06-10",
  schools: 4,
  marked: 4,
  overall_present_rate: 91.4,
  chronic_absentees: ["SYN-S-CHN-014", "SYN-S-S2-007"],
  per_school: [
    { date: "33030004181", marked: 1, present: 28, absent: 2, late: 1, excused: 0, present_rate: 93.3 },
    { date: "33030004182", marked: 1, present: 26, absent: 3, late: 0, excused: 1, present_rate: 89.7 },
    { date: "33040006271", marked: 1, present: 25, absent: 2, late: 1, excused: 0, present_rate: 92.6 },
    { date: "33040006272", marked: 1, present: 24, absent: 3, late: 0, excused: 0, present_rate: 88.9 },
  ],
  synthetic: true,
}

// ── SMC Meetings & Resolutions ───────────────────────────────────────────────────────────────────────────
export const demoSMCDashboard: PlatformSMCDashboard = {
  scope: SCOPE,
  meetings: 4,
  by_status: { convened: 2, scheduled: 2 },
  convened: 2,
  quorate_rate: 100,
  resolutions: 4,
  open_actions: 2,
  action_list: [
    { id: "SMC-CHN-Q1-R02", subject: "Repair drinking-water unit", owner: "SYN-PARENT-CHN", due_date: "2026-06-30", status: "open" },
    { id: "SMC-S2-Q1-R02", subject: "Repair drinking-water unit", owner: "SYN-PARENT-S2", due_date: "2026-06-30", status: "open" },
  ],
  synthetic: true,
}

export const demoSMCMeetings: PlatformSMCMeeting[] = [
  {
    id: "SMC-CHN-Q1", org_unit: "33030004181", title: "Q1 School Development Review", scheduled_date: "2026-06-10",
    total_members: 12, parent_members: 9, present_count: 8, status: "convened",
    resolutions: [
      { id: "SMC-CHN-Q1-R01", subject: "Approve School Development Plan budget", owner: "SYN-HM-CHN", due_date: "2026-07-15", status: "done" },
      { id: "SMC-CHN-Q1-R02", subject: "Repair drinking-water unit", owner: "SYN-PARENT-CHN", due_date: "2026-06-30", status: "open" },
    ],
    created_on: "2026-06-02", updated_at: "2026-06-25T00:00:00Z",
  },
  {
    id: "SMC-CHN-Q2", org_unit: "33030004181", title: "Q2 Mid-Day Meal & Safety Review", scheduled_date: "2026-09-12",
    total_members: 12, parent_members: 9, present_count: 0, status: "scheduled", resolutions: [],
    created_on: "2026-06-20", updated_at: "2026-06-25T00:00:00Z",
  },
]

// ── Bonafide Certificate Register ────────────────────────────────────────────────────────────────────────
export const demoBonafideDashboard: PlatformBonafideDashboard = {
  scope: SCOPE,
  total: 4,
  by_status: { issued: 2, requested: 2 },
  by_purpose: { scholarship: 2, "bus-pass": 2 },
  issued: 2,
  pending_work: [
    { id: "BNF-CHN-02", org_unit: "33030004181", student_id: "SYN-S-CHN-002", student_name: "SYN Student Two", purpose: "bus-pass", serial: "", status: "requested", requested_on: "2026-06-20", issued_on: "", updated_at: "2026-06-25T00:00:00Z" },
  ],
  synthetic: true,
}

export const demoBonafideList: PlatformBonafide[] = [
  { id: "BNF-CHN-01", org_unit: "33030004181", student_id: "SYN-S-CHN-001", student_name: "SYN Student One", purpose: "scholarship", serial: "BNF/33030004181/2026/0001", status: "issued", requested_on: "2026-06-12", issued_on: "2026-06-13", updated_at: "2026-06-25T00:00:00Z" },
  { id: "BNF-CHN-02", org_unit: "33030004181", student_id: "SYN-S-CHN-002", student_name: "SYN Student Two", purpose: "bus-pass", serial: "", status: "requested", requested_on: "2026-06-20", issued_on: "", updated_at: "2026-06-25T00:00:00Z" },
]

// ── Teacher Transfer & Posting ───────────────────────────────────────────────────────────────────────────
export const demoTeacherTransferDashboard: PlatformTeacherTransferDashboard = {
  scope: SCOPE,
  total: 2,
  by_status: { posted: 1, requested: 1 },
  by_reason: { request: 1, mutual: 1 },
  posted: 1,
  pending_work: [
    { id: "TT-CHN-02", employee_id: "SYN-T-CHN-REQ", name: "SYN Requesting Teacher", cadre: "Graduate Teacher (BT)", from_org: "33040006271", to_org: "33030004181", reason: "mutual", status: "requested", requested_on: "2026-06-18", updated_at: "2026-06-25T00:00:00Z" },
  ],
  synthetic: true,
}

export const demoTeacherTransferList: PlatformTeacherTransfer[] = [
  { id: "TT-CHN-01", employee_id: "SYN-T-CHN-IN", name: "SYN Transferring Teacher", cadre: "Graduate Teacher (BT)", from_org: "33040006271", to_org: "33030004181", reason: "request", status: "posted", requested_on: "2026-05-20", decided_on: "2026-05-25", updated_at: "2026-06-25T00:00:00Z" },
  { id: "TT-CHN-02", employee_id: "SYN-T-CHN-REQ", name: "SYN Requesting Teacher", cadre: "Graduate Teacher (BT)", from_org: "33040006271", to_org: "33030004181", reason: "mutual", status: "requested", requested_on: "2026-06-18", updated_at: "2026-06-25T00:00:00Z" },
]

// ── Audit Trail & Integrity Ledger ───────────────────────────────────────────────────────────────────────
export const demoAuditTrail: PlatformAuditTrail = {
  length: 6,
  head: "9f3c…a71b",
  merkle_root: "4e8d…002f",
  intact: true,
  bad_index: -1,
  effect_census: { executed: 4, permit: 1, "require-approval": 1 },
  matched: 6,
  records: [
    { seq: 1, ts: "2026-06-25T00:00:00Z", actor: "establishment-officer", action: "establishment.sanction", resource: "ESTAB-CHN-02", effect: "executed", detail: "Graduate Teacher (BT) x8", prev_hash: "—", hash: "1a2b…" },
    { seq: 2, ts: "2026-06-25T00:01:00Z", actor: "hr-officer", action: "teacher-transfer.approve", resource: "TT-CHN-01", effect: "executed", detail: "→33030004181 (cadre Graduate Teacher (BT))", prev_hash: "1a2b…", hash: "2b3c…" },
    { seq: 3, ts: "2026-06-25T00:02:00Z", actor: "registrar", action: "bonafide.issue", resource: "BNF-CHN-01", effect: "executed", detail: "serial BNF/33030004181/2026/0001", prev_hash: "2b3c…", hash: "3c4d…" },
    { seq: 4, ts: "2026-06-25T00:03:00Z", actor: "smc", action: "smc.resolve", resource: "SMC-CHN-Q1", effect: "executed", detail: "Approve School Development Plan budget", prev_hash: "3c4d…", hash: "4d5e…" },
    { seq: 5, ts: "2026-06-25T00:04:00Z", actor: "deo-chennai", action: "rte.admission.review", resource: "ADM-CHN-014", effect: "require-approval", detail: "§12(1)(c) EWS reject → HITL", prev_hash: "4d5e…", hash: "5e6f…" },
    { seq: 6, ts: "2026-06-25T00:05:00Z", actor: "principal-egmore", action: "attendance.mark", resource: "33030004181", effect: "permit", detail: "28/30 present", prev_hash: "5e6f…", hash: "9f3c…a71b" },
  ],
}

// ── School Inspection & Monitoring ───────────────────────────────────────────────────────────────────────
export const demoInspectionDashboard: PlatformInspectionDashboard = {
  scope: SCOPE,
  total: 6,
  by_status: { closed: 3, action_taken: 1, open: 2 },
  by_type: { academic: 2, administrative: 2, safety: 1, financial: 1 },
  open: 2,
  avg_compliance: 78.5,
  low_compliance: [
    { id: "INS-CHN-04", org_unit: "33030004181", type: "safety", inspector_id: "SYN-INSP-02", visited_on: "2026-06-08", compliance_score: 62, findings: "Fire extinguishers overdue for refill; one fire exit obstructed.", status: "open", updated_at: "2026-06-25T00:00:00Z" },
  ],
  open_worklist: [
    { id: "INS-CHN-04", org_unit: "33030004181", type: "safety", inspector_id: "SYN-INSP-02", visited_on: "2026-06-08", compliance_score: 62, findings: "Fire extinguishers overdue; one exit obstructed.", status: "open", updated_at: "2026-06-25T00:00:00Z" },
    { id: "INS-S2-03", org_unit: "33030004182", type: "academic", inspector_id: "SYN-INSP-01", visited_on: "2026-06-11", compliance_score: 74, findings: "FLN remediation register not maintained for Grade 3.", status: "open", updated_at: "2026-06-25T00:00:00Z" },
  ],
  synthetic: true,
}

// ── Transfer Certificates ────────────────────────────────────────────────────────────────────────────────
export const demoTCDashboard: PlatformTCDashboard = {
  scope: SCOPE,
  total: 5,
  by_status: { issued: 3, requested: 1, cancelled: 1 },
  by_reason: { transfer: 2, completion: 2, migration: 1 },
  issued: 3,
  pending: [
    { id: "TC-CHN-05", org_unit: "33030004181", student_id: "SYN-S-CHN-031", reason: "transfer", status: "requested", requested_on: "2026-06-19", updated_at: "2026-06-25T00:00:00Z" },
  ],
  synthetic: true,
}

// ── Staff Attendance & Payable Days ──────────────────────────────────────────────────────────────────────
export const demoStaffAttendanceDashboard: PlatformStaffAttendanceDashboard = {
  scope: SCOPE,
  date: "2026-06-01",
  schools: 4,
  employees: 60,
  marked_today: 58,
  present_rate: 93.1,
  on_leave: 3,
  lwp_staff: ["SYN-T-041", "SYN-T-052-S2"],
  synthetic: true,
}

// ── School Grant Utilisation (money in paise) ────────────────────────────────────────────────────────────
export const demoGrantDashboard: PlatformGrantDashboard = {
  scope: SCOPE,
  grants: 8,
  allocated_paise: 12_00_000_00,
  spent_paise: 7_80_000_00,
  balance_paise: 4_20_000_00,
  utilisation_pct: 65,
  by_head_allocated: { composite: 6_00_000_00, library: 2_00_000_00, sports: 2_00_000_00, maintenance: 2_00_000_00 },
  low_utilisation: [
    { id: "GRT-CHN-sports", org_unit: "33030004181", head: "sports", allocated_paise: 50_000_00, spent_paise: 8_000_00, year: 2026, status: "open", updated_at: "2026-06-25T00:00:00Z" },
  ],
  synthetic: true,
}

// ── Lesson Plans ─────────────────────────────────────────────────────────────────────────────────────────
export const demoLessonPlanDashboard: PlatformLessonPlanDashboard = {
  scope: SCOPE,
  total: 12,
  by_status: { published: 8, draft: 4 },
  by_subject: { Mathematics: 4, Tamil: 4, Science: 4 },
  published: 8,
  draft_worklist: [
    { id: "LP-CHN-03", org_unit: "33030004181", class: "Grade 8-A", subject: "Science", teacher_id: "SYN-T-03", topic: "Photosynthesis", objectives: "", tags: "NEP-4.6, EVS", resources: "https://diksha.gov.in/", periods: 2, status: "draft", created_on: "2026-06-18", updated_at: "2026-06-25T00:00:00Z" },
  ],
  synthetic: true,
}

// ── Period Attendance & Lesson Delivery ──────────────────────────────────────────────────────────────────
export const demoPeriodDashboard: PlatformPeriodDashboard = {
  scope: SCOPE,
  periods: 24,
  delivered: 23,
  not_held: 1,
  present_rate: 92.0,
  by_subject: [
    { subject: "Mathematics", periods: 6, present: 168, possible: 180, present_pct: 93.3 },
    { subject: "Tamil", periods: 6, present: 160, possible: 174, present_pct: 92.0 },
    { subject: "Science", periods: 5, present: 138, possible: 150, present_pct: 92.0 },
    { subject: "Social Science", periods: 6, present: 158, possible: 176, present_pct: 89.8 },
  ],
  teacher_engagement: { "SYN-T-03": 6, "SYN-T-07": 6, "SYN-T-11": 5, "SYN-T-15": 6 },
  synthetic: true,
}

export function demoPeriodSheetFor(cls = "Grade 8-A", date = "2026-06-01"): PlatformPeriodAttendance[] {
  const base = { org_unit: "33030004181", class: cls, date, day: "monday", strength: 30, updated_at: "2026-06-25T00:00:00Z" }
  return [
    { ...base, id: `PA-CHN-${date}-1`, period: 1, subject: "Mathematics", teacher_id: "SYN-T-03", start: "09:00", end: "09:45", lesson_plan_id: "LP-CHN-01", status: "delivered", present_count: 28 },
    { ...base, id: `PA-CHN-${date}-2`, period: 2, subject: "Tamil", teacher_id: "SYN-T-07", start: "09:45", end: "10:30", lesson_plan_id: "", status: "delivered", present_count: 29 },
    { ...base, id: `PA-CHN-${date}-3`, period: 3, subject: "Science", teacher_id: "SYN-T-11", start: "10:30", end: "11:15", lesson_plan_id: "", status: "delivered", present_count: 27 },
    { ...base, id: `PA-CHN-${date}-4`, period: 4, subject: "Social Science", teacher_id: "SYN-T-15", start: "11:15", end: "12:00", lesson_plan_id: "", status: "not_held", present_count: 0 },
  ]
}

// ── RTE Admissions ───────────────────────────────────────────────────────────────────────────────────────
export const demoAdmissionDashboard: PlatformAdmissionDashboard = {
  tenant: SCOPE,
  total: 10,
  by_stage: { admitted: 6, "pending-review": 2, applied: 1, rejected: 1 },
  by_category: { OC: 3, BC: 3, MBC: 2, SC: 1, EWS: 1 },
  admitted: 6,
  pending_review: 2,
  applications: [
    { id: "ADM-CHN-001", category: "EWS", age: 6, tenant: SCOPE, region: "Chennai", decision: "require-approval", stage: "pending-review", effect: "require-approval", reasons: "RTE §12(1)(c) EWS seat — HITL review", pii_sealed: true, decided_at: "2026-06-20" },
    { id: "ADM-CHN-002", category: "BC", age: 6, tenant: SCOPE, region: "Chennai", decision: "permit", stage: "admitted", effect: "executed", reasons: "Age + documents valid", credential_id: "APAAR-CHN-002", pii_sealed: true, decided_at: "2026-06-18" },
    { id: "ADM-CHN-003", category: "OC", age: 7, tenant: SCOPE, region: "Chennai", decision: "permit", stage: "admitted", effect: "executed", reasons: "Age + documents valid", credential_id: "APAAR-CHN-003", pii_sealed: true, decided_at: "2026-06-18" },
  ],
}

// ── Grievance Cases ──────────────────────────────────────────────────────────────────────────────────────
export const demoGrievanceCases: PlatformGrievanceCase[] = [
  {
    id: "GRV-CHN-001", complainant: "parent-aarthi", category: "infrastructure", subject: "Classroom roof leak in Block B",
    org_unit: "33030004181", status: "escalated", current_tier: 2, filed_at: "2026-06-10", due_at: "2026-06-17",
    escalation_chain: [
      { role: "PRINCIPAL", decision: "escalated", decided_by: "principal-egmore", decided_at: "2026-06-12", note: "Beyond school budget — referred to BEO" },
      { role: "BEO", decision: "", note: "" },
    ],
    updated_at: "2026-06-25T00:00:00Z",
  },
  {
    id: "GRV-CHN-002", complainant: "parent-aarthi", category: "academic", subject: "Subject teacher vacancy (Maths)",
    org_unit: "33030004181", status: "resolved", current_tier: 1, filed_at: "2026-06-05", due_at: "2026-06-12",
    escalation_chain: [{ role: "PRINCIPAL", decision: "resolved", decided_by: "principal-egmore", decided_at: "2026-06-09", note: "Guest teacher engaged pending transfer" }],
    resolution: "Guest teacher engaged; transfer requested.", updated_at: "2026-06-25T00:00:00Z",
  },
]

// ── Scholarship / DBT ────────────────────────────────────────────────────────────────────────────────────
export const demoScholarshipDashboard: PlatformScholarshipDashboard = {
  scope: SCOPE,
  total: 12,
  by_status: { disbursed: 6, reconciled: 3, sanctioned: 1, pending: 1, flagged: 1 },
  by_scheme: { "Pre-Matric SC": 4, "BC/MBC": 5, "Girl-Child Incentive": 3 },
  pending_sanction: 1,
  disbursed_rupees: 1_84_000,
  flagged_leakage: 1,
  pending: [
    { id: "DBT-CHN-011", student_id: "SYN-S-CHN-011", scheme: "Pre-Matric SC", amount_paise: 12_000_00, org_unit: "33030004181", status: "pending", approval_chain: [{ role: "PRINCIPAL", decision: "" }], current_step: 0, filed_at: "2026-06-21", updated_at: "2026-06-25T00:00:00Z" },
  ],
  synthetic: true,
}

export const demoScholarshipList: PlatformDisbursement[] = [
  { id: "DBT-CHN-001", student_id: "SYN-S-CHN-001", scheme: "BC/MBC", amount_paise: 8_000_00, org_unit: "33030004181", status: "disbursed", approval_chain: [{ role: "PRINCIPAL", decision: "approved", decided_by: "principal-egmore" }, { role: "BEO", decision: "approved", decided_by: "beo-egmore" }], current_step: 2, payment_ref: "PFMS-CHN-0001", filed_at: "2026-05-30", updated_at: "2026-06-25T00:00:00Z" },
  { id: "DBT-CHN-011", student_id: "SYN-S-CHN-011", scheme: "Pre-Matric SC", amount_paise: 12_000_00, org_unit: "33030004181", status: "pending", approval_chain: [{ role: "PRINCIPAL", decision: "" }], current_step: 0, filed_at: "2026-06-21", updated_at: "2026-06-25T00:00:00Z" },
]

// ── Mid-Day Meal (PM-POSHAN) ─────────────────────────────────────────────────────────────────────────────
export const demoMdmDashboard: PlatformMdmDashboard = {
  scope: SCOPE,
  schools: 4,
  meal_days: 20,
  meals_served: 2_180,
  enrolment_days: 2_360,
  coverage_pct: 92.4,
  consumed_grams: 2_18_000,
  low_stock_schools: [
    { org_unit: "33040006272", balance_grams: 18_000, consumed_grams: 52_000, meal_days: 20, avg_daily_grams: 2_600, days_of_cover: 6.9, low_stock: true },
  ],
  stock_rollup: [
    { org_unit: "33030004181", balance_grams: 84_000, consumed_grams: 60_000, meal_days: 20, avg_daily_grams: 3_000, days_of_cover: 28, low_stock: false },
    { org_unit: "33040006272", balance_grams: 18_000, consumed_grams: 52_000, meal_days: 20, avg_daily_grams: 2_600, days_of_cover: 6.9, low_stock: true },
  ],
  synthetic: true,
}

// ── School Transport ─────────────────────────────────────────────────────────────────────────────────────
export const demoTransportDashboard: PlatformTransportDashboard = {
  scope: SCOPE,
  as_of: "2026-06-25",
  routes: 3,
  total_capacity: 150,
  total_seated: 122,
  utilisation_pct: 81.3,
  unserviceable_routes: [
    { route_id: "RT-CHN-03", name: "Egmore – Perambur", vehicle_no: "TN-01-AB-3003", capacity: 50, seated: 40, serviceable: false, safety_reason: "Fitness certificate expired 2026-06-15" },
  ],
  routes_rollup: [
    { route_id: "RT-CHN-01", name: "Egmore – Anna Nagar", vehicle_no: "TN-01-AB-1001", capacity: 50, seated: 46, serviceable: true },
    { route_id: "RT-CHN-02", name: "Egmore – T Nagar", vehicle_no: "TN-01-AB-2002", capacity: 50, seated: 36, serviceable: true },
    { route_id: "RT-CHN-03", name: "Egmore – Perambur", vehicle_no: "TN-01-AB-3003", capacity: 50, seated: 40, serviceable: false, safety_reason: "Fitness certificate expired 2026-06-15" },
  ],
  synthetic: true,
}

export function demoRouteRosterFor(routeId: string): PlatformTransportAllotment[] {
  return [
    { id: `${routeId}-A01`, route_id: routeId, org_unit: "33030004181", student_id: "SYN-S-CHN-001", stop: "Anna Nagar", status: "allotted" },
    { id: `${routeId}-A02`, route_id: routeId, org_unit: "33030004181", student_id: "SYN-S-CHN-002", stop: "Shenoy Nagar", status: "allotted" },
  ]
}

// ── Health Immunisation ──────────────────────────────────────────────────────────────────────────────────
export const demoImmunisationDashboard: PlatformImmunisationDashboard = {
  scope: SCOPE,
  students: 40,
  doses_recorded: 188,
  coverage: [
    { vaccine: "DPT-B", name: "DPT Booster", complete: 34, partial: 4, due: 2, coverage_pct: 85 },
    { vaccine: "MR2", name: "Measles-Rubella 2", complete: 36, partial: 2, due: 2, coverage_pct: 90 },
    { vaccine: "TD", name: "Td (10y)", complete: 30, partial: 6, due: 4, coverage_pct: 75 },
  ],
  worklist: [
    { student_id: "SYN-S-CHN-021", vaccine: "TD", status: "due" },
    { student_id: "SYN-S-CHN-022", vaccine: "DPT-B", status: "partial" },
  ],
  synthetic: true,
}

export function demoStudentImmunisationCardFor(student: string): PlatformStudentImmunisation {
  return { student_id: student || "SYN-S-CHN-001", status: { "DPT-B": "complete", MR2: "complete", TD: "due" }, doses_recorded: 5 }
}

// ── Free-Supply Entitlement ──────────────────────────────────────────────────────────────────────────────
export const demoEntitlementDashboard: PlatformEntitlementDashboard = {
  scope: SCOPE,
  students: 120,
  items: [
    { item: "Textbooks (set)", entitled_qty: 120, issued_qty: 116, fulfilled_students: 116, pending_students: 4, fulfilment_pct: 96.7 },
    { item: "Uniform (2 sets)", entitled_qty: 240, issued_qty: 220, fulfilled_students: 110, pending_students: 10, fulfilment_pct: 91.7 },
    { item: "Shoes (pair)", entitled_qty: 120, issued_qty: 104, fulfilled_students: 104, pending_students: 16, fulfilment_pct: 86.7 },
  ],
  shortfall: [
    { entitlement_id: "ENT-CHN-shoes", student_id: "SYN-S-CHN-031", item: "Shoes (pair)", remaining: 1 },
    { entitlement_id: "ENT-CHN-uniform", student_id: "SYN-S-CHN-044", item: "Uniform (2 sets)", remaining: 1 },
  ],
  synthetic: true,
}

// ── Class Timetable ──────────────────────────────────────────────────────────────────────────────────────
export const demoTimetableDashboard: PlatformTimetableDashboard = {
  scope: SCOPE,
  slots: 30,
  classes: 1,
  teachers: 5,
  teacher_load: { "SYN-T-03": 8, "SYN-T-07": 7, "SYN-T-11": 6, "SYN-T-15": 6, "SYN-T-19": 3 },
  overloaded_teachers: [],
  synthetic: true,
}

const DEMO_SLOTS: PlatformSlot[] = [
  { org_unit: "33030004181", class: "Grade 8-A", day: "monday", period: 1, subject: "Mathematics", teacher_id: "SYN-T-03" },
  { org_unit: "33030004181", class: "Grade 8-A", day: "monday", period: 2, subject: "Tamil", teacher_id: "SYN-T-07" },
  { org_unit: "33030004181", class: "Grade 8-A", day: "monday", period: 3, subject: "Science", teacher_id: "SYN-T-11" },
  { org_unit: "33030004181", class: "Grade 8-A", day: "monday", period: 4, subject: "Social Science", teacher_id: "SYN-T-15" },
  { org_unit: "33030004181", class: "Grade 8-A", day: "tuesday", period: 1, subject: "English", teacher_id: "SYN-T-19" },
]
export function demoClassTimetable(org: string, klass: string): PlatformSlot[] {
  return DEMO_SLOTS.map((s) => ({ ...s, org_unit: org || s.org_unit, class: klass || s.class }))
}
export function demoTeacherTimetable(teacher: string): PlatformSlot[] {
  return DEMO_SLOTS.filter((s) => s.teacher_id === teacher || teacher === "SYN-T-03").slice(0, 3)
}

// ── School Library ───────────────────────────────────────────────────────────────────────────────────────
export const demoLibraryDashboard: PlatformLibraryDashboard = {
  scope: SCOPE,
  as_of: "2026-06-25",
  active_loans: 38,
  overdue: 3,
  overdue_loans: [
    { id: "LN-CHN-014", org_unit: "33030004181", book_id: "BK-022", title: "Ponniyin Selvan Vol. 1", copy_id: "BK-022-C2", member_id: "SYN-S-CHN-014", issued_on: "2026-05-20", due_on: "2026-06-10", status: "on_loan", renewals: 1 },
  ],
  lost: 1,
  members: 120,
  titles: 540,
  synthetic: true,
}

// ── Estate & Asset Register ──────────────────────────────────────────────────────────────────────────────
export const demoInfraDashboard: PlatformInfraDashboard = {
  scope: SCOPE,
  assets: 48,
  by_condition: { good: 30, fair: 12, poor: 5, unusable: 1 },
  under_maintenance: 3,
  decommissioned: 1,
  open_tickets: 4,
  open_by_severity: { critical: 1, high: 1, medium: 1, low: 1 },
  needs_attention: [
    { id: "AST-CHN-Block-B-roof", org_unit: "33030004181", name: "Block B Roof", category: "room", condition: "poor", status: "under_maintenance", acquired_on: "2012-04-01" },
    { id: "AST-CHN-toilet-girls", org_unit: "33030004181", name: "Girls' Toilet Block", category: "sanitation", condition: "fair", status: "in_service", acquired_on: "2018-06-01" },
  ],
  synthetic: true,
}
export function demoAssetTicketsFor(assetID: string): PlatformTicket[] {
  return [
    { id: `${assetID}-T1`, asset_id: assetID, org_unit: "33030004181", issue: "Water seepage during monsoon", severity: "high", status: "in_progress", raised_on: "2026-06-12", assignee: "SYN-MAINT-02" },
  ]
}

// ── Parent–Teacher Meetings ──────────────────────────────────────────────────────────────────────────────
export const demoPtmDashboard: PlatformPtmDashboard = {
  scope: SCOPE,
  sessions: 3,
  total_slots: 90,
  occupied: 64,
  attended: 52,
  turnout_pct: 81.3,
  sessions_rollup: [
    { session_id: "PTM-CHN-01", title: "Term-1 Progress PTM", date: "2026-06-14", slots: 30, booked: 26, attended: 22, no_show: 4, fill_pct: 86.7, turnout_pct: 84.6 },
    { session_id: "PTM-CHN-02", title: "FLN Parents' Circle", date: "2026-06-21", slots: 30, booked: 20, attended: 16, no_show: 4, fill_pct: 66.7, turnout_pct: 80.0 },
  ],
  low_turnout: [
    { session_id: "PTM-CHN-03", title: "Grade-10 Board Prep", date: "2026-06-28", slots: 30, booked: 18, attended: 14, no_show: 4, fill_pct: 60.0, turnout_pct: 77.8 },
  ],
  synthetic: true,
}
export function demoSessionSheetFor(sessionID: string): PlatformPtmBooking[] {
  return [
    { id: `${sessionID}-B1`, session_id: sessionID, org_unit: "33030004181", student_id: "SYN-S-CHN-001", guardian: "Guardian of SYN-S-CHN-001", status: "attended", slot: "10:00" },
    { id: `${sessionID}-B2`, session_id: sessionID, org_unit: "33030004181", student_id: "SYN-S-CHN-002", guardian: "Guardian of SYN-S-CHN-002", status: "booked", slot: "10:15" },
    { id: `${sessionID}-B3`, session_id: sessionID, org_unit: "33030004181", student_id: "SYN-S-CHN-003", guardian: "Guardian of SYN-S-CHN-003", status: "no_show", slot: "10:30" },
  ]
}

// ── RBSK Health Screening ────────────────────────────────────────────────────────────────────────────────
export const demoRbskDashboard: PlatformRbskDashboard = {
  scope: SCOPE,
  screened: 116,
  healthy: 98,
  with_findings: 18,
  by_finding: { dental: 7, vision: 5, anaemia: 4, "skin/ENT": 2 },
  active_referrals: 6,
  closed: 12,
  referral_closure_rate: 66.7,
  synthetic: true,
}

// ── Teacher CPD (NEP-2020) ───────────────────────────────────────────────────────────────────────────────
export const demoCpdDashboard: PlatformCpdDashboard = {
  scope: SCOPE,
  year: 2026,
  teachers: 15,
  compliant: 9,
  compliance_rate: 60,
  total_hours: 612,
  deficient_teachers: ["SYN-T-11", "SYN-T-15", "SYN-T-19"],
  synthetic: true,
}

// ── Academic Calendar ────────────────────────────────────────────────────────────────────────────────────
const CAL_ENTRIES: PlatformCalendarEntry[] = [
  { id: "CAL-CHN-term1", title: "Term 1 begins", type: "term", start_date: "2026-06-01", end_date: "2026-09-30", org_unit: SCOPE, academic_year: "2026-27", status: "approved", current_step: 2, created_at: "2026-05-01", updated_at: "2026-06-25T00:00:00Z", synthetic: true },
  { id: "CAL-CHN-qexam", title: "Quarterly Examinations", type: "exam", start_date: "2026-09-15", end_date: "2026-09-25", org_unit: SCOPE, academic_year: "2026-27", status: "pending", approval_chain: [{ tier: "G4", approver_role: "DEO", required_scope: SCOPE, decision: "approved", decided_by: "deo-chennai" }, { tier: "G3", approver_role: "DIRECTOR", required_scope: "TN", decision: "" }], current_step: 1, created_at: "2026-06-10", updated_at: "2026-06-25T00:00:00Z", synthetic: true },
  { id: "CAL-CHN-pongal", title: "Pongal Holidays", type: "holiday", start_date: "2027-01-14", end_date: "2027-01-17", org_unit: SCOPE, academic_year: "2026-27", status: "approved", current_step: 2, created_at: "2026-05-01", updated_at: "2026-06-25T00:00:00Z", synthetic: true },
]
export const demoCalendarDashboard: PlatformCalendarDashboard = {
  scope: SCOPE,
  academic_year: "2026-27",
  total: 8,
  by_type: { term: 2, exam: 2, holiday: 3, ptm: 1 },
  by_status: { approved: 5, pending: 2, draft: 1 },
  pending_approvals: 2,
  published: 5,
  my_inbox: [CAL_ENTRIES[1]],
  upcoming: CAL_ENTRIES,
  synthetic: true,
}
export function demoCalendarEntriesFor(type = "", year = ""): PlatformCalendarEntry[] {
  return CAL_ENTRIES.filter((e) => (!type || e.type === type) && (!year || e.academic_year === year))
}

// ── Examinations & Results ───────────────────────────────────────────────────────────────────────────────
const EXAM_STATS = { entered: 30, pass: 26, fail: 4, pass_pct: 86.7, mean_marks: 64.2, highest: 96, grade_distribution: { "A+": 4, A: 8, B: 10, C: 4, D: 4 } }
export const demoExamDashboard: PlatformExamDashboard = {
  scope: SCOPE,
  sheets: 4,
  by_status: { published: 2, submitted: 1, open: 1 },
  results_recorded: 108,
  overall_pass: 94,
  overall_pass_pct: 87.0,
  per_sheet: [
    { exam_id: "EX-CHN-QT1-MATH", org_unit: "33030004181", subject: "Mathematics", class: "Grade 8-A", status: "published", stats: EXAM_STATS },
    { exam_id: "EX-CHN-QT1-TAM", org_unit: "33030004181", subject: "Tamil", class: "Grade 8-A", status: "published", stats: { ...EXAM_STATS, pass: 28, fail: 2, pass_pct: 93.3, mean_marks: 68.1 } },
    { exam_id: "EX-CHN-QT1-SCI", org_unit: "33030004181", subject: "Science", class: "Grade 8-A", status: "submitted", stats: { ...EXAM_STATS, pass: 24, fail: 6, pass_pct: 80.0, mean_marks: 60.4 } },
  ],
  synthetic: true,
}
export function demoExamSheetFor(examID: string): PlatformExamSheet {
  return {
    exam_id: examID || "EX-CHN-QT1-MATH", org_unit: "33030004181", subject: "Mathematics", class: "Grade 8-A", status: "published",
    results: [
      { student_id: "SYN-S-CHN-001", marks: 78, grade: "A", pass: true },
      { student_id: "SYN-S-CHN-002", marks: 64, grade: "B", pass: true },
      { student_id: "SYN-S-CHN-003", marks: 33, grade: "D", pass: false },
      { student_id: "SYN-S-CHN-004", marks: 92, grade: "A+", pass: true },
    ],
    stats: EXAM_STATS,
    synthetic: true,
  }
}

// ── User Directory & IAM ─────────────────────────────────────────────────────────────────────────────────
const DIR_SAMPLE: PlatformDirectoryUser[] = [
  { id: "admin", name: "Platform Administrator", role: "ADMIN", org_unit: "TN", attributes: { cadre: "PMU" } },
  { id: "deo-chennai", name: "District Education Officer — Chennai", role: "DEO", org_unit: "TN-DIST-Chennai", attributes: { district: "Chennai" } },
  { id: "principal-egmore", name: "Principal — GHSS Egmore", role: "PRINCIPAL", org_unit: "33010100101", attributes: { school: "33010100101" } },
  { id: "teacher-egmore", name: "Teacher — Class 9-A", role: "TEACHER", org_unit: "33010100101", attributes: { school: "33010100101" } },
]
export const demoDirectorySummary: PlatformDirectorySummary = {
  users: 23,
  roles: 16,
  role_census: { DIRECTOR: 7, ADMIN: 1, DEO: 1, BEO: 1, CRCC: 1, PRINCIPAL: 1, TEACHER: 1, STUDENT: 1, PARENT: 1, SECRETARY: 1, MINISTER: 1 },
  catalogue: [
    { code: "PRINCIPAL", name: "Principal / Headmaster", tier: "school", grants: ["manage:school", "manage:staff", "resolve:grievance"] },
    { code: "DEO", name: "District Education Officer", tier: "district", grants: ["read:district", "allocate:resource", "approve:recognition"] },
    { code: "TEACHER", name: "Teacher", tier: "school", grants: ["read:class", "write:attendance", "write:assessment"] },
  ],
  sample: DIR_SAMPLE,
  access_models: ["RBAC", "ABAC", "ReBAC", "PBAC", "context"],
  synthetic: true,
}
export function demoDirectoryScopedFor(scope: string): PlatformDirectoryUser[] {
  return DIR_SAMPLE
}
