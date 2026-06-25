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
