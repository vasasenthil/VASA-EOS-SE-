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
  PlatformHostelDashboard,
  PlatformHostel,
  PlatformCifmDashboard,
  PlatformFacility,
  PlatformProcurementDashboard,
  PlatformPurchaseOrder,
  PlatformSubstitution,
  PlatformLanguageLabDashboard,
  PlatformTranslationJob,
  PlatformWashDashboard,
  PlatformWashRegister,
  PlatformCompetitionDashboard,
  PlatformCompetition,
  PlatformInventoryDashboard,
  PlatformStockItem,
  PlatformVisitorDashboard,
  PlatformVisitorPass,
  PlatformWaterDashboard,
  PlatformWaterTest,
  PlatformCircularDashboard,
  PlatformCircular,
  PlatformRemedialDashboard,
  PlatformRemedialBatch,
  PlatformRegistrationDashboard,
  PlatformActivityEvent,
  PlatformClinicDashboard,
  PlatformClinicVisit,
  PlatformImprestDashboard,
  PlatformImprestBook,
  PlatformDisciplinaryDashboard,
  PlatformDisciplinaryCase,
  PlatformLibraryFineDashboard,
  PlatformMemberFines,
  PlatformSavingsDashboard,
  PlatformSavingsAccount,
  PlatformVehicleFitnessDashboard,
  PlatformFitnessVehicle,
  PlatformIndentDashboard,
  PlatformTextbookIndent,
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

// ── Hostel Allocation & Occupancy ────────────────────────────────────────────────────────────────────────
export const demoHostelDashboard: PlatformHostelDashboard = {
  scope: SCOPE,
  hostels: 4,
  capacity: 200,
  occupied: 170,
  occupancy_pct: 85,
  by_type: { boys: 2, girls: 2 },
  near_full: [
    { id: "HOS-CHN-boys", org_unit: "33030004181", name: "boys Welfare Hostel", type: "boys", capacity: 50, status: "open", created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z" },
  ],
  synthetic: true,
}

export const demoHostels: PlatformHostel[] = [
  { id: "HOS-CHN-boys", org_unit: "33030004181", name: "boys Welfare Hostel", type: "boys", capacity: 50, status: "open", residents: Array.from({ length: 47 }, (_, i) => ({ student_id: `SYN-S-CHN-boys-${String(i + 1).padStart(3, "0")}`, allotted_on: "2026-06-02" })), created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z" },
  { id: "HOS-CHN-girls", org_unit: "33030004181", name: "girls Welfare Hostel", type: "girls", capacity: 50, status: "open", residents: Array.from({ length: 38 }, (_, i) => ({ student_id: `SYN-S-CHN-girls-${String(i + 1).padStart(3, "0")}`, allotted_on: "2026-06-02" })), created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z" },
]

// ── CIFM — Campus Infrastructure & Facilities Management ─────────────────────────────────────────────────
export const demoCifmDashboard: PlatformCifmDashboard = {
  scope: SCOPE,
  facilities: 16,
  by_category: { building: 4, toilet: 4, water: 4, electrical: 4 },
  by_status: { operational: 12, under_maintenance: 4 },
  by_condition: { good: 8, fair: 4, poor: 4 },
  open_work_orders: 6,
  critical_open: 2,
  under_maintenance: 4,
  needs_attention: [
    {
      id: "FAC-CHN-02", org_unit: "33030004181", name: "Girls' Toilet Block", category: "toilet", condition: "poor",
      status: "under_maintenance", amc_vendor: "SYN-AMC-CHN", amc_expiry: "2027-03-31",
      work_orders: [{ id: "FAC-CHN-02-WO01", title: "Sewage overflow — health hazard", priority: "critical", status: "open", raised_on: "2026-06-25" }],
      created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z",
    },
  ],
  synthetic: true,
}

export const demoFacilities: PlatformFacility[] = [
  { id: "FAC-CHN-01", org_unit: "33030004181", name: "Main Block", category: "building", condition: "fair", status: "operational", amc_vendor: "SYN-AMC-CHN", amc_expiry: "2027-03-31", work_orders: [{ id: "FAC-CHN-01-WO01", title: "Repaint corridor", priority: "low", status: "open", raised_on: "2026-06-25" }], created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z" },
  { id: "FAC-CHN-02", org_unit: "33030004181", name: "Girls' Toilet Block", category: "toilet", condition: "poor", status: "under_maintenance", amc_vendor: "SYN-AMC-CHN", amc_expiry: "2027-03-31", work_orders: [{ id: "FAC-CHN-02-WO01", title: "Sewage overflow — health hazard", priority: "critical", status: "open", raised_on: "2026-06-25" }], created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z" },
  { id: "FAC-CHN-03", org_unit: "33030004181", name: "RO Drinking-Water Unit", category: "water", condition: "good", status: "operational", amc_vendor: "SYN-AMC-CHN", amc_expiry: "2027-03-31", created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z" },
  { id: "FAC-CHN-04", org_unit: "33030004181", name: "Main Distribution Board", category: "electrical", condition: "good", status: "operational", amc_vendor: "SYN-AMC-CHN", amc_expiry: "2027-03-31", created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z" },
]

// ── Native AI Language Lab ───────────────────────────────────────────────────────────────────────────────
export const demoLanguageLabDashboard: PlatformLanguageLabDashboard = {
  scope: SCOPE,
  jobs: 6,
  by_status: { published: 2, translated: 2, requested: 2 },
  by_target_lang: { ta: 2, te: 2, hi: 2 },
  published: 2,
  machine_assisted: 4,
  languages_covered: ["ta"],
  review_worklist: [
    { id: "TJ-CHN-02", org_unit: "33030004181", title: "Scholarship circular", domain: "circular", source_lang: "en", target_lang: "te", status: "translated", machine_assisted: true, translator: "SYN-TR-CHN", created_on: "2026-06-20", updated_at: "2026-06-25T00:00:00Z" },
  ],
  synthetic: true,
}

export const demoTranslationJobs: PlatformTranslationJob[] = [
  { id: "TJ-CHN-01", org_unit: "33030004181", title: "Mid-term PTM notice", domain: "parent-comms", source_lang: "en", target_lang: "ta", status: "published", machine_assisted: true, translator: "SYN-TR-CHN", reviewer: "SYN-RV-CHN", created_on: "2026-06-10", updated_at: "2026-06-25T00:00:00Z" },
  { id: "TJ-CHN-02", org_unit: "33030004181", title: "Scholarship circular", domain: "circular", source_lang: "en", target_lang: "te", status: "translated", machine_assisted: true, translator: "SYN-TR-CHN", created_on: "2026-06-20", updated_at: "2026-06-25T00:00:00Z" },
  { id: "TJ-CHN-03", org_unit: "33030004181", title: "FLN worksheet pack", domain: "curriculum", source_lang: "en", target_lang: "hi", status: "requested", machine_assisted: false, created_on: "2026-06-22", updated_at: "2026-06-25T00:00:00Z" },
]

// ── Procurement & GeM Purchase Orders (money in paise) ───────────────────────────────────────────────────
export const demoProcurementDashboard: PlatformProcurementDashboard = {
  scope: SCOPE,
  pos: 12,
  by_status: { ordered: 11, closed: 1 },
  ordered_value_paise: 9_30_000_00,
  received_value_paise: 6_30_000_00,
  paid_paise: 4_00_000_00,
  outstanding_paise: 2_30_000_00,
  pending_receipt: [
    { id: "PO-CHN-03", org_unit: "33030004181", item: "Library books", vendor: "SYN-VEN-BOOK", gem_contract: "GEMC-CHN-003", ordered_qty: 200, unit_price_paise: 350_00, received_qty: 0, paid_paise: 0, status: "ordered", created_on: "2026-06-20", updated_at: "2026-06-25T00:00:00Z" },
  ],
  synthetic: true,
}

export const demoPurchaseOrders: PlatformPurchaseOrder[] = [
  { id: "PO-CHN-01", org_unit: "33030004181", item: "Dual-desk benches", vendor: "SYN-VEN-FURN", gem_contract: "GEMC-CHN-001", ordered_qty: 50, unit_price_paise: 2_500_00, received_qty: 30, paid_paise: 50_000_00, status: "ordered", created_on: "2026-06-05", updated_at: "2026-06-25T00:00:00Z" },
  { id: "PO-CHN-02", org_unit: "33030004181", item: "Smart-class tablets", vendor: "SYN-VEN-ICT", gem_contract: "GEMC-CHN-002", ordered_qty: 20, unit_price_paise: 9_000_00, received_qty: 20, paid_paise: 0, status: "ordered", created_on: "2026-06-12", updated_at: "2026-06-25T00:00:00Z" },
  { id: "PO-CHN-03", org_unit: "33030004181", item: "Library books", vendor: "SYN-VEN-BOOK", gem_contract: "GEMC-CHN-003", ordered_qty: 200, unit_price_paise: 350_00, received_qty: 0, paid_paise: 0, status: "ordered", created_on: "2026-06-20", updated_at: "2026-06-25T00:00:00Z" },
]

// ── Timetable Substitution ───────────────────────────────────────────────────────────────────────────────
export const demoSubstitutions: PlatformSubstitution[] = [
  { id: "SUB-CHN-01", org_unit: "33030004181", class: "Grade 8-A", day: "monday", period: 2, date: "2026-06-29", subject: "Tamil", original_teacher: "SYN-T-07", substitute_teacher: "SYN-T-019", reason: "regular teacher on RBSK duty", status: "assigned", created_on: "2026-06-25", updated_at: "2026-06-25T00:00:00Z" },
]

// ── School Sanitation / WASH Register ────────────────────────────────────────────────────────────────────
export const demoWashRegisters: PlatformWashRegister[] = [
  { id: "WASH-CHN", org_unit: "33030004181", school_name: "Govt School CHN", certified: true, certified_on: "2026-06-25", status: "certified", created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z", facilities: [
    { category: "girls_toilet", sanctioned_units: 6, functional_units: 6, last_inspected: "2026-06-25" },
    { category: "boys_toilet", sanctioned_units: 6, functional_units: 5, last_inspected: "2026-06-25" },
    { category: "cwsn_toilet", sanctioned_units: 2, functional_units: 2, last_inspected: "2026-06-25" },
    { category: "drinking_water", sanctioned_units: 3, functional_units: 3, last_inspected: "2026-06-25" },
    { category: "handwash_station", sanctioned_units: 8, functional_units: 8, last_inspected: "2026-06-25" },
  ] },
  { id: "WASH-CBE", org_unit: "33030004182", school_name: "Govt School CBE", certified: false, status: "registered", created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z", facilities: [
    { category: "girls_toilet", sanctioned_units: 6, functional_units: 6, last_inspected: "2026-06-25" },
    { category: "boys_toilet", sanctioned_units: 6, functional_units: 5, last_inspected: "2026-06-25" },
    { category: "cwsn_toilet", sanctioned_units: 2, functional_units: 2, last_inspected: "2026-06-25" },
    { category: "drinking_water", sanctioned_units: 3, functional_units: 1, last_inspected: "2026-06-25" },
    { category: "handwash_station", sanctioned_units: 8, functional_units: 8, last_inspected: "2026-06-25" },
  ] },
]

export const demoWashDashboard: PlatformWashDashboard = {
  scope: SCOPE,
  schools: 4,
  certified: 1,
  facilities: 20,
  sanctioned_units: 100,
  functional_units: 86,
  functional_pct: 86,
  by_category_functional: { girls_toilet: 22, boys_toilet: 20, cwsn_toilet: 8, drinking_water: 8, handwash_station: 28 },
  pending: [demoWashRegisters[1]],
  synthetic: true,
}

// ── Co-curricular & Sports Competitions ──────────────────────────────────────────────────────────────────
export const demoCompetitions: PlatformCompetition[] = [
  { id: "COMP-CHN-ATH", org_unit: "33030004181", name: "100m Sprint", discipline: "athletics", level: "school", event_date: "2026-07-10", status: "open", created_on: "2026-06-15", updated_at: "2026-06-25T00:00:00Z", entries: [
    { student_id: "SYN-S-CHN-A01", class: "Grade 9", position: 1, advanced: true, entered_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-A02", class: "Grade 9", position: 2, advanced: false, entered_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-A03", class: "Grade 9", position: 3, advanced: false, entered_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-A04", class: "Grade 9", position: 0, advanced: false, entered_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-A05", class: "Grade 9", position: 0, advanced: false, entered_on: "2026-06-25" },
  ] },
  { id: "COMP-CHN-CHESS", org_unit: "33030004181", name: "Chess Open", discipline: "chess", level: "school", event_date: "2026-07-20", status: "open", created_on: "2026-06-18", updated_at: "2026-06-25T00:00:00Z", entries: [
    { student_id: "SYN-S-CHN-C01", class: "Grade 8", position: 0, advanced: false, entered_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-C02", class: "Grade 8", position: 0, advanced: false, entered_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-C03", class: "Grade 8", position: 0, advanced: false, entered_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-C04", class: "Grade 8", position: 0, advanced: false, entered_on: "2026-06-25" },
  ] },
  { id: "COMP-CHN-DEB", org_unit: "33030004181", name: "Inter-class Debate", discipline: "debate", level: "school", event_date: "2026-06-05", status: "closed", created_on: "2026-05-25", updated_at: "2026-06-25T00:00:00Z", entries: [
    { student_id: "SYN-S-CHN-D01", class: "Grade 10", position: 1, advanced: false, entered_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-D02", class: "Grade 10", position: 0, advanced: false, entered_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-D03", class: "Grade 10", position: 0, advanced: false, entered_on: "2026-06-25" },
  ] },
]

export const demoCompetitionDashboard: PlatformCompetitionDashboard = {
  scope: SCOPE,
  total: 12,
  by_level: { school: 12 },
  by_status: { open: 8, closed: 4 },
  entries: 48,
  podium: 16,
  advanced: 4,
  open_meets: [demoCompetitions[0], demoCompetitions[1]],
  synthetic: true,
}

// ── School Stores / Inventory ────────────────────────────────────────────────────────────────────────────
export const demoStockItems: PlatformStockItem[] = [
  { id: "STK-CHN-01", org_unit: "33030004181", name: "A4 paper", category: "stationery", unit: "ream", on_hand: 40, reorder_level: 10, received: 40, issued: 0, status: "active", created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z" },
  { id: "STK-CHN-02", org_unit: "33030004181", name: "Chalk boxes", category: "stationery", unit: "pack", on_hand: 8, reorder_level: 10, received: 30, issued: 22, status: "active", created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z" },
  { id: "STK-CHN-03", org_unit: "33030004181", name: "Lab gloves", category: "lab", unit: "pack", on_hand: 25, reorder_level: 5, received: 25, issued: 0, status: "active", created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z" },
  { id: "STK-CHN-04", org_unit: "33030004181", name: "Football", category: "sports", unit: "nos", on_hand: 6, reorder_level: 4, received: 6, issued: 0, status: "active", created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z" },
]

export const demoInventoryDashboard: PlatformInventoryDashboard = {
  scope: SCOPE,
  items: 16,
  by_status: { active: 16 },
  on_hand: 312,
  received: 404,
  issued: 92,
  low_stock: [demoStockItems[1]],
  synthetic: true,
}

// ── Visitor & Gate Management ────────────────────────────────────────────────────────────────────────────
export const demoVisitorPasses: PlatformVisitorPass[] = [
  { id: "VIS-CHN-01", org_unit: "33030004181", visitor_id: "SYN-V-CHN-01", name: "Visitor SYN-V-CHN-01", purpose: "parent_meeting", host: "SYN-T-CHN-07", check_in_at: "2026-06-25T09:10:00Z", status: "checked_in", created_on: "2026-06-25", updated_at: "2026-06-25T09:30:00Z" },
  { id: "VIS-CHN-02", org_unit: "33030004181", visitor_id: "SYN-V-CHN-02", name: "Visitor SYN-V-CHN-02", purpose: "vendor", host: "SYN-HM-CHN", check_in_at: "2026-06-25T09:25:00Z", status: "checked_in", created_on: "2026-06-25", updated_at: "2026-06-25T09:30:00Z" },
  { id: "VIS-CHN-03", org_unit: "33030004181", visitor_id: "SYN-V-CHN-03", name: "Visitor SYN-V-CHN-03", purpose: "inspection", host: "SYN-HM-CHN", check_in_at: "2026-06-25T08:40:00Z", check_out_at: "2026-06-25T09:15:00Z", status: "checked_out", created_on: "2026-06-25", updated_at: "2026-06-25T09:30:00Z" },
]

export const demoVisitorDashboard: PlatformVisitorDashboard = {
  scope: SCOPE,
  total: 12,
  on_premises: 8,
  checked_out: 4,
  by_purpose: { parent_meeting: 4, vendor: 4, inspection: 4 },
  present: [demoVisitorPasses[0], demoVisitorPasses[1]],
  synthetic: true,
}

// ── Water Quality Testing ────────────────────────────────────────────────────────────────────────────────
const STD_WATER_PARAMS: PlatformWaterTest["parameters"] = [
  { name: "ph", value: 7.2, safe_min: 6.5, safe_max: 8.5, critical: true },
  { name: "turbidity_ntu", value: 1.0, safe_min: 0, safe_max: 5, critical: true },
  { name: "ecoli_cfu", value: 0, safe_min: 0, safe_max: 0, critical: true },
  { name: "tds_mgl", value: 320, safe_min: 0, safe_max: 500, critical: false },
  { name: "residual_chlorine", value: 0.4, safe_min: 0.2, safe_max: 1.0, critical: false },
]

export const demoWaterTests: PlatformWaterTest[] = [
  { id: "WTR-CHN", org_unit: "33030004181", source: "borewell", sample_date: "2026-06-20", status: "approved", tested_on: "2026-06-25", created_on: "2026-06-20", updated_at: "2026-06-25T00:00:00Z", parameters: STD_WATER_PARAMS },
  { id: "WTR-CBE", org_unit: "33030004182", source: "borewell", sample_date: "2026-06-20", status: "failed", tested_on: "2026-06-25", remarks: "E.coli detected — source chlorinated and resampled", created_on: "2026-06-20", updated_at: "2026-06-25T00:00:00Z", parameters: [
    { name: "ph", value: 7.2, safe_min: 6.5, safe_max: 8.5, critical: true },
    { name: "turbidity_ntu", value: 1.0, safe_min: 0, safe_max: 5, critical: true },
    { name: "ecoli_cfu", value: 12, safe_min: 0, safe_max: 0, critical: true },
    { name: "tds_mgl", value: 320, safe_min: 0, safe_max: 500, critical: false },
    { name: "residual_chlorine", value: 0.4, safe_min: 0.2, safe_max: 1.0, critical: false },
  ] },
]

export const demoWaterDashboard: PlatformWaterDashboard = {
  scope: SCOPE,
  samples: 4,
  by_status: { approved: 1, failed: 1, tested: 2 },
  by_source: { borewell: 4 },
  potable: 1,
  unsafe: 1,
  unsafe_list: [demoWaterTests[1]],
  synthetic: true,
}

// ── Notice Board & Circulars ─────────────────────────────────────────────────────────────────────────────
export const demoCirculars: PlatformCircular[] = [
  { id: "CIR-CHN-EXAM", org_unit: "33030004181", title: "Half-yearly exam schedule", category: "examination", summary: "Datesheet and seating plan", target_count: 5, status: "published", published_on: "2026-06-25", created_on: "2026-06-15", updated_at: "2026-06-25T00:00:00Z", acks: [
    { recipient_id: "SYN-T-CHN-01", acked_on: "2026-06-25" },
    { recipient_id: "SYN-T-CHN-02", acked_on: "2026-06-25" },
    { recipient_id: "SYN-T-CHN-03", acked_on: "2026-06-25" },
  ] },
  { id: "CIR-CHN-SAFE", org_unit: "33030004181", title: "Fire-drill protocol", category: "safety", summary: "Quarterly evacuation drill", target_count: 3, status: "published", published_on: "2026-06-25", created_on: "2026-06-10", updated_at: "2026-06-25T00:00:00Z", acks: [
    { recipient_id: "SYN-T-CHN-01", acked_on: "2026-06-25" },
    { recipient_id: "SYN-T-CHN-02", acked_on: "2026-06-25" },
    { recipient_id: "SYN-T-CHN-03", acked_on: "2026-06-25" },
  ] },
  { id: "CIR-CHN-ADMIN", org_unit: "33030004181", title: "Staff meeting agenda", category: "administrative", summary: "Monthly review", target_count: 6, status: "draft", created_on: "2026-06-22", updated_at: "2026-06-25T00:00:00Z" },
]

export const demoCircularDashboard: PlatformCircularDashboard = {
  scope: SCOPE,
  circulars: 12,
  by_status: { published: 8, draft: 4 },
  targets: 56,
  acks: 41,
  ack_pct: 73.2,
  pending: [demoCirculars[0]],
  synthetic: true,
}

// ── Diagnostic & Remedial Learning (NIPUN FLN) ───────────────────────────────────────────────────────────
export const demoRemedialBatches: PlatformRemedialBatch[] = [
  { id: "REM-CHN-LIT", org_unit: "33030004181", subject: "literacy", target_level: 4, capacity: 10, status: "open", created_on: "2026-06-10", updated_at: "2026-06-25T00:00:00Z", enrollments: [
    { student_id: "SYN-S-CHN-L01", level: 1, exited: true, exit_level: 4, enrolled_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-L02", level: 2, exited: false, enrolled_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-L03", level: 3, exited: false, enrolled_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-L04", level: 1, exited: false, enrolled_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-L05", level: 2, exited: false, enrolled_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-L06", level: 3, exited: false, enrolled_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-L07", level: 1, exited: false, enrolled_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-L08", level: 2, exited: false, enrolled_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-L09", level: 3, exited: false, enrolled_on: "2026-06-25" },
  ] },
  { id: "REM-CHN-NUM", org_unit: "33030004181", subject: "numeracy", target_level: 3, capacity: 12, status: "open", created_on: "2026-06-12", updated_at: "2026-06-25T00:00:00Z", enrollments: [
    { student_id: "SYN-S-CHN-N01", level: 1, exited: false, enrolled_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-N02", level: 2, exited: false, enrolled_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-N03", level: 1, exited: false, enrolled_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-N04", level: 2, exited: false, enrolled_on: "2026-06-25" },
  ] },
]

export const demoRemedialDashboard: PlatformRemedialDashboard = {
  scope: SCOPE,
  batches: 8,
  by_subject: { literacy: 4, numeracy: 4 },
  by_status: { open: 8 },
  active: 48,
  graduated: 4,
  graduate_pct: 7.7,
  near_full: [demoRemedialBatches[0]],
  synthetic: true,
}

// ── Co-curricular Registration ───────────────────────────────────────────────────────────────────────────
export const demoActivityEvents: PlatformActivityEvent[] = [
  { id: "EVT-CHN-TRIAL", org_unit: "33030004181", name: "District football trial", category: "sports", seat_cap: 4, event_date: "2026-07-15", next_seq: 7, status: "open", created_on: "2026-06-15", updated_at: "2026-06-25T00:00:00Z", registrations: [
    { student_id: "SYN-S-CHN-T01", state: "confirmed", seq: 1, registered_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-T02", state: "confirmed", seq: 2, registered_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-T03", state: "confirmed", seq: 3, registered_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-T04", state: "confirmed", seq: 4, registered_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-T05", state: "waitlisted", seq: 5, registered_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-T06", state: "waitlisted", seq: 6, registered_on: "2026-06-25" },
  ] },
  { id: "EVT-CHN-ARTS", org_unit: "33030004181", name: "Madhubani art workshop", category: "arts", seat_cap: 20, event_date: "2026-07-22", next_seq: 9, status: "open", created_on: "2026-06-18", updated_at: "2026-06-25T00:00:00Z", registrations: [
    { student_id: "SYN-S-CHN-A01", state: "confirmed", seq: 1, registered_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-A02", state: "confirmed", seq: 2, registered_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-A03", state: "confirmed", seq: 3, registered_on: "2026-06-25" },
    { student_id: "SYN-S-CHN-A04", state: "confirmed", seq: 4, registered_on: "2026-06-25" },
  ] },
]

export const demoRegistrationDashboard: PlatformRegistrationDashboard = {
  scope: SCOPE,
  events: 8,
  by_category: { sports: 4, arts: 4 },
  by_status: { open: 8 },
  confirmed: 48,
  waitlisted: 8,
  seats: 96,
  fill_pct: 50,
  waitlists: [demoActivityEvents[0]],
  synthetic: true,
}

// ── School Health Clinic / Sick-Room ─────────────────────────────────────────────────────────────────────
export const demoClinicVisits: PlatformClinicVisit[] = [
  { id: "CLN-CHN-01", org_unit: "33030004181", student_id: "SYN-S-CHN-C01", complaint: "Headache", status: "open", reported_at: "2026-06-25T10:00:00Z", created_on: "2026-06-25", updated_at: "2026-06-25T10:00:00Z", treatments: [{ note: "Rest + ORS", given_on: "2026-06-25" }] },
  { id: "CLN-CHN-02", org_unit: "33030004181", student_id: "SYN-S-CHN-C02", complaint: "Minor cut", status: "closed", outcome: "recovered", reported_at: "2026-06-25T09:10:00Z", closed_at: "2026-06-25T10:00:00Z", created_on: "2026-06-25", updated_at: "2026-06-25T10:00:00Z", treatments: [{ note: "Antiseptic + dressing", given_on: "2026-06-25" }] },
  { id: "CLN-CHN-03", org_unit: "33030004181", student_id: "SYN-S-CHN-C03", complaint: "High fever", status: "closed", outcome: "referred", destination: "PHC-CHN", reported_at: "2026-06-25T08:40:00Z", closed_at: "2026-06-25T10:00:00Z", created_on: "2026-06-25", updated_at: "2026-06-25T10:00:00Z" },
]

export const demoClinicDashboard: PlatformClinicDashboard = {
  scope: SCOPE,
  visits: 12,
  open_now: 4,
  by_outcome: { recovered: 5, referred: 2, sent_home: 1 },
  referrals: 2,
  open_list: [demoClinicVisits[0]],
  synthetic: true,
}

// ── Petty Cash / Imprest (money in paise) ────────────────────────────────────────────────────────────────
export const demoImprestBooks: PlatformImprestBook[] = [
  { id: "IMP-CHN", org_unit: "33030004181", sanctioned_paise: 10_000_00, cash_paise: 7_950_00, status: "open", created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z", vouchers: [
    { id: "V-CHN-01", payee: "SYN-VEN-STAT", purpose: "Stationery", amount_paise: 1_200_00, recorded_on: "2026-06-25" },
    { id: "V-CHN-02", payee: "SYN-VEN-REPAIR", purpose: "Fan repair", amount_paise: 850_00, recorded_on: "2026-06-25" },
  ] },
  { id: "IMP-CBE", org_unit: "33030004182", sanctioned_paise: 10_000_00, cash_paise: 10_000_00, status: "open", created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z" },
]

export const demoImprestDashboard: PlatformImprestDashboard = {
  scope: SCOPE,
  books: 4,
  by_status: { open: 4 },
  sanctioned_paise: 40_000_00,
  cash_paise: 35_900_00,
  spent_paise: 8_200_00,
  unreimbursed_paise: 4_100_00,
  outstanding: [demoImprestBooks[0]],
  synthetic: true,
}

// ── Staff Disciplinary / Vigilance ───────────────────────────────────────────────────────────────────────
export const demoDisciplinaryCases: PlatformDisciplinaryCase[] = [
  { id: "DIS-CHN-01", org_unit: "33030004181", employee_id: "SYN-T-CHN-11", charge: "Unauthorised absence", appealed: false, stage: "charge_issued", created_on: "2026-06-18", updated_at: "2026-06-25T00:00:00Z" },
  { id: "DIS-CHN-02", org_unit: "33030004181", employee_id: "SYN-T-CHN-12", charge: "Negligence of duty", inquiry_findings: "Charge substantiated on two of three counts", appealed: false, stage: "under_inquiry", created_on: "2026-06-12", updated_at: "2026-06-25T00:00:00Z" },
  { id: "DIS-CHN-03", org_unit: "33030004181", employee_id: "SYN-T-CHN-13", charge: "Misconduct", inquiry_findings: "Charge proved", penalty: "withhold_increment", appeal_grounds: "Penalty disproportionate to the proven charge", appealed: true, stage: "decided", created_on: "2026-06-05", updated_at: "2026-06-25T00:00:00Z" },
]

export const demoDisciplinaryDashboard: PlatformDisciplinaryDashboard = {
  scope: SCOPE,
  cases: 12,
  by_stage: { charge_issued: 4, under_inquiry: 4, decided: 3, closed: 1 },
  by_penalty: { withhold_increment: 2, censure: 1 },
  under_appeal: 2,
  pending_inquiry: [demoDisciplinaryCases[0]],
  synthetic: true,
}

// ── Library Fine Ledger (money in paise) ─────────────────────────────────────────────────────────────────
export const demoFineLedgers: PlatformMemberFines[] = [
  { id: "FINE-CHN-M1", org_unit: "33030004181", member_id: "SYN-S-CHN-M1", block_threshold_paise: 100_00, created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z", fines: [
    { id: "F-CHN-1", book: "Wings of Fire", days_overdue: 5, amount_paise: 10_00, paid_paise: 10_00, status: "paid", accrued_on: "2026-06-25" },
  ] },
  { id: "FINE-CHN-M2", org_unit: "33030004181", member_id: "SYN-S-CHN-M2", block_threshold_paise: 100_00, created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z", fines: [
    { id: "F-CHN-2", book: "Atlas of India", days_overdue: 80, amount_paise: 160_00, paid_paise: 0, status: "open", accrued_on: "2026-06-25" },
  ] },
]

export const demoLibraryFineDashboard: PlatformLibraryFineDashboard = {
  scope: SCOPE,
  ledgers: 8,
  outstanding_paise: 640_00,
  collected_paise: 120_00,
  waived_paise: 40_00,
  blocked: 4,
  blocked_list: [demoFineLedgers[1]],
  synthetic: true,
}

// ── School Bank / Student Savings (money in paise) ───────────────────────────────────────────────────────
export const demoSavingsAccounts: PlatformSavingsAccount[] = [
  { id: "SAV-CHN-01", org_unit: "33030004181", student_id: "SYN-S-CHN-S1", balance_paise: 350_00, frozen: false, status: "active", created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z", transactions: [
    { id: "T-CHN-1", kind: "deposit", amount_paise: 500_00, balance_after: 500_00, recorded_on: "2026-06-25" },
    { id: "T-CHN-2", kind: "withdrawal", amount_paise: 150_00, balance_after: 350_00, recorded_on: "2026-06-25" },
  ] },
  { id: "SAV-CHN-02", org_unit: "33030004181", student_id: "SYN-S-CHN-S2", balance_paise: 200_00, frozen: true, status: "active", created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z", transactions: [
    { id: "T-CHN-3", kind: "deposit", amount_paise: 200_00, balance_after: 200_00, recorded_on: "2026-06-25" },
  ] },
]

export const demoSavingsDashboard: PlatformSavingsDashboard = {
  scope: SCOPE,
  accounts: 8,
  by_status: { active: 8 },
  balance_paise: 2_200_00,
  deposits_paise: 2_800_00,
  withdrawn_paise: 600_00,
  frozen: 4,
  frozen_list: [demoSavingsAccounts[1]],
  synthetic: true,
}

// ── Vehicle Fitness / Transport-Safety ───────────────────────────────────────────────────────────────────
const FIT_DOCS = (overrides: Record<string, boolean> = {}): PlatformFitnessVehicle["documents"] =>
  ["fitness", "insurance", "permit", "puc", "driver_licence"].map((kind) => ({
    kind, valid: overrides[kind] ?? true, expiry: "2027-03-31", updated_on: "2026-06-25",
  }))

export const demoFitnessVehicles: PlatformFitnessVehicle[] = [
  { id: "VEH-CHN", org_unit: "33030004181", reg_no: "SYN-TN-CHN-0001", status: "cleared", created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z", documents: FIT_DOCS() },
  { id: "VEH-CBE", org_unit: "33030004182", reg_no: "SYN-TN-CBE-0001", status: "grounded", created_on: "2026-06-01", updated_at: "2026-06-25T00:00:00Z", documents: FIT_DOCS({ insurance: false }) },
]

export const demoVehicleFitnessDashboard: PlatformVehicleFitnessDashboard = {
  scope: SCOPE,
  vehicles: 4,
  cleared: 1,
  grounded: 3,
  grounds: [demoFitnessVehicles[1]],
  synthetic: true,
}

// ── Textbook / Uniform Indent ────────────────────────────────────────────────────────────────────────────
export const demoIndents: PlatformTextbookIndent[] = [
  { id: "IND-CHN-BOOK", org_unit: "33030004181", item: "textbook_set", entitled_qty: 320, indented_qty: 300, approved_qty: 0, supplied_qty: 0, status: "raised", created_on: "2026-06-15", updated_at: "2026-06-25T00:00:00Z" },
  { id: "IND-CHN-UNI", org_unit: "33030004181", item: "uniform_set", entitled_qty: 320, indented_qty: 300, approved_qty: 280, supplied_qty: 200, status: "approved", created_on: "2026-06-10", updated_at: "2026-06-25T00:00:00Z" },
  { id: "IND-CHN-NB", org_unit: "33030004181", item: "notebook_pack", entitled_qty: 320, indented_qty: 320, approved_qty: 320, supplied_qty: 320, status: "supplied", created_on: "2026-06-05", updated_at: "2026-06-25T00:00:00Z" },
]

export const demoIndentDashboard: PlatformIndentDashboard = {
  scope: SCOPE,
  indents: 12,
  by_status: { raised: 4, approved: 4, supplied: 4 },
  entitled_qty: 3840,
  indented_qty: 3680,
  approved_qty: 2400,
  supplied_qty: 2080,
  pending_approve: [demoIndents[0]],
  synthetic: true,
}
