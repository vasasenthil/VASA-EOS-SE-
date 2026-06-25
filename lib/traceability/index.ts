// VASA-EOS(SE) — requirements traceability (user story → module → route → test).
//
// A verifiable map from stakeholder user stories to the modules that implement them
// and the tests that cover them. Pure data + helpers so it can be rendered in-app and
// exported. This is a *representative* matrix across every stakeholder role (not the
// full 362-line requirement catalogue); each row points at real files in this repo.

import { csvField } from "@/lib/csv"

export type TraceStatus = "done" | "partial" | "planned"

export interface TraceItem {
  id: string
  /** Portal role the story belongs to. */
  role: string
  /** "As a <role>, I can …". */
  story: string
  /** lib/app module keys that implement it. */
  modules: string[]
  /** Primary route a user exercises. */
  route: string
  /** Test files covering it (under tests/). */
  tests: string[]
  status: TraceStatus
}

export const TRACE_MATRIX: TraceItem[] = [
  // Learners & family
  { id: "US-STU-1", role: "STUDENT", story: "As a student, I can see my courses, grades and resources.", modules: ["sis", "hpc"], route: "/student/dashboard", tests: ["portal-data.test.ts", "hpc.test.ts"], status: "done" },
  { id: "US-STU-2", role: "STUDENT", story: "As a student, I get an APAAR lifelong learner ID on enrolment.", modules: ["admissionsflow", "apaar"], route: "/apaar", tests: ["admissionsflow-store.test.ts"], status: "done" },
  { id: "US-PAR-1", role: "PARENT", story: "As a parent, I can file a grievance and track its escalation.", modules: ["grievanceflow", "grievance"], route: "/grievance-approvals", tests: ["grievanceflow-store.test.ts"], status: "done" },
  { id: "US-PAR-2", role: "PARENT", story: "As a parent, I can give/withdraw DPDP consent for my child's data.", modules: ["consent"], route: "/consent", tests: ["store-layer.test.ts"], status: "done" },

  // School staff
  { id: "US-TCH-1", role: "TEACHER", story: "As a teacher, I can mark daily attendance.", modules: ["attendance"], route: "/attendance", tests: ["attendance.test.ts"], status: "done" },
  { id: "US-TCH-2", role: "TEACHER", story: "As a teacher, I can apply for leave through a dynamic approval flow.", modules: ["leaveflow", "workflow"], route: "/leave-approvals", tests: ["leaveflow-store.test.ts", "workflow.test.ts"], status: "done" },
  { id: "US-TCH-3", role: "TEACHER", story: "As a teacher, I can record a holistic progress card.", modules: ["hpc"], route: "/hpc", tests: ["hpc.test.ts"], status: "done" },
  { id: "US-PRI-1", role: "PRINCIPAL", story: "As a principal, I log disciplinary incidents (scoped to my school).", modules: ["discipline", "access/scope"], route: "/discipline", tests: ["discipline.test.ts", "scope-rollout.test.ts"], status: "done" },
  { id: "US-PRI-2", role: "PRINCIPAL", story: "As a principal, I manage the anti-ragging & safety log.", modules: ["safety", "access/scope"], route: "/safety", tests: ["safety-store.test.ts"], status: "done" },
  { id: "US-PRI-3", role: "PRINCIPAL", story: "As a principal, I triage and close maintenance tickets.", modules: ["maintenanceflow"], route: "/maintenance-approvals", tests: ["maintenanceflow-store.test.ts"], status: "done" },

  // Field administration
  { id: "US-CRC-1", role: "CRCC", story: "As a CRC coordinator, I see my cluster's schools only.", modules: ["access/scope"], route: "/governance/scope", tests: ["access-scope.test.ts"], status: "done" },
  { id: "US-BEO-1", role: "BEO", story: "As a BEO, I approve long-leave at the block tier.", modules: ["leaveflow"], route: "/leave-approvals", tests: ["leaveflow-store.test.ts"], status: "done" },
  { id: "US-BEO-2", role: "BEO", story: "As a BEO, my dashboards are scoped to my block's data.", modules: ["access/scope", "discipline"], route: "/discipline", tests: ["scope-rollout.test.ts"], status: "done" },
  { id: "US-DEO-1", role: "DEO", story: "As a DEO, I scrutinise school recognition at the district tier.", modules: ["recognitionflow"], route: "/recognition-approvals", tests: ["approval-flows.test.ts"], status: "done" },
  { id: "US-DEO-2", role: "DEO", story: "As a DEO, I see my district's records only (no other districts).", modules: ["access/scope"], route: "/governance/scope", tests: ["access-scope.test.ts"], status: "done" },

  // State leadership
  { id: "US-DIR-1", role: "DIRECTOR", story: "As a director, I adopt forum resolutions by quorum (RACI).", modules: ["forumflow", "workflow"], route: "/governance/forums", tests: ["forumflow-store.test.ts"], status: "done" },
  { id: "US-SEC-1", role: "SECRETARY", story: "As a secretary, I oversee every approval in flight statewide.", modules: ["governance/oversight"], route: "/governance/oversight", tests: ["governance-oversight.test.ts"], status: "done" },
  { id: "US-SEC-2", role: "SECRETARY", story: "As a secretary, I track NEP implementation analytics.", modules: ["tracking/analytics"], route: "/tracking/analytics", tests: ["tracking-analytics.test.ts"], status: "done" },
  { id: "US-MIN-1", role: "MINISTER", story: "As the minister, I ratify significant forum resolutions.", modules: ["forumflow"], route: "/governance/forums", tests: ["forumflow-store.test.ts"], status: "done" },
  { id: "US-MIN-2", role: "MINISTER", story: "As the minister, I see executive scheme-outcome dashboards.", modules: ["schemes", "tracking/analytics"], route: "/minister/dashboard", tests: ["tracking-analytics.test.ts"], status: "partial" },

  // External & platform
  { id: "US-VEN-1", role: "VENDOR", story: "As a vendor, I do work on assigned maintenance tickets.", modules: ["maintenanceflow"], route: "/maintenance-approvals", tests: ["maintenanceflow-store.test.ts"], status: "done" },
  { id: "US-RES-1", role: "RESEARCHER", story: "As a researcher, I am denied PII (anonymised datasets only).", modules: ["access"], route: "/governance/access", tests: ["access-policy.test.ts"], status: "done" },
  { id: "US-PUB-1", role: "PUBLIC", story: "As a citizen, I file an RTI request and track its SLA.", modules: ["rti"], route: "/rti", tests: ["rti.test.ts"], status: "done" },
  { id: "US-PUB-2", role: "PUBLIC", story: "As a citizen, I look up any platform abbreviation.", modules: ["glossary"], route: "/glossary", tests: ["glossary.test.ts"], status: "done" },
  { id: "US-ADM-1", role: "ADMIN", story: "As an admin, I verify the tamper-evident audit ledger.", modules: ["audit"], route: "/admin/audit-log", tests: ["audit.test.ts"], status: "done" },
  { id: "US-ADM-2", role: "ADMIN", story: "As an admin, I monitor readiness, metrics and integrations.", modules: ["readiness", "metrics", "integrations"], route: "/ops", tests: ["readiness.test.ts", "metrics.test.ts"], status: "done" },
]

export interface TraceSummary {
  total: number
  done: number
  partial: number
  planned: number
  withTests: number
  /** % of stories with at least one covering test. */
  coveragePct: number
  roles: number
}

export function traceSummary(items: TraceItem[] = TRACE_MATRIX): TraceSummary {
  const withTests = items.filter((i) => i.tests.length > 0).length
  return {
    total: items.length,
    done: items.filter((i) => i.status === "done").length,
    partial: items.filter((i) => i.status === "partial").length,
    planned: items.filter((i) => i.status === "planned").length,
    withTests,
    coveragePct: items.length === 0 ? 0 : Math.round((withTests / items.length) * 100),
    roles: new Set(items.map((i) => i.role)).size,
  }
}

export interface RoleGroup {
  role: string
  items: TraceItem[]
}

/** Group stories by role, preserving first-seen role order. */
export function byRole(items: TraceItem[] = TRACE_MATRIX): RoleGroup[] {
  const order: string[] = []
  for (const i of items) if (!order.includes(i.role)) order.push(i.role)
  return order.map((role) => ({ role, items: items.filter((i) => i.role === role) }))
}

export function filterByStatus(status: TraceStatus | "all", items: TraceItem[] = TRACE_MATRIX): TraceItem[] {
  return status === "all" ? items : items.filter((i) => i.status === status)
}


/** RFC 4180 CSV of the traceability matrix — the downloadable register. */
export function toCSV(items: TraceItem[] = TRACE_MATRIX): string {
  const header = ["ID", "Role", "User story", "Modules", "Route", "Tests", "Status"]
  const rows = items.map((i) =>
    [i.id, i.role, i.story, i.modules.join("; "), i.route, i.tests.join("; "), i.status].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
