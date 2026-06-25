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
