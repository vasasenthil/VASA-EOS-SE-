// VASA-EOS(SE) — map common dashboard nav titles to typed i18n message keys.
//
// The live sidebar renders role-driven nav titles (free strings). Where a title has a committed,
// localised MessageKey, the chrome translates (Tamil-first); everything else falls back to its English
// title — honest partial coverage, never a broken or half-keyed label. The Record<…, MessageKey> type
// guarantees every mapped value is a real key (a typo would not compile).

import type { MessageKey } from "./resources"

// Keyed by the EXACT dashboard nav titles (config/dashboard-nav.ts) that have a committed key.
const NAV_KEYS: Record<string, MessageKey> = {
  Dashboard: "nav.dashboard",
  Attendance: "nav.attendance",
  Schemes: "nav.schemes",
  Governance: "nav.governance",
  Accessibility: "nav.accessibility",
  "Fee Management": "nav.fees",
  "Staff Management": "nav.staff",
  "Students (SIS)": "nav.students",
  Announcements: "nav.announcements",
  Communications: "nav.communications",
  "Audit Log": "nav.auditLog",
  Compliance: "nav.compliance",
  Certificates: "nav.certificates",
  Library: "nav.library",
  "AI Agents": "nav.aiAgents",
  "Assessment & Exams": "nav.assessments",
  "Admissions & Enrolment": "nav.admissions",
  "Academic Calendar": "nav.academicCalendar",
}

/** The typed message key for a nav title, or undefined if it is not (yet) localised. */
export function navMessageKey(title: string): MessageKey | undefined {
  return NAV_KEYS[title]
}
