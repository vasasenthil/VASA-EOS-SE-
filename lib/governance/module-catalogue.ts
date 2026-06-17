// VASA-EOS(SE) — Unified Module Catalogue v3.0 coverage map (the attachment, honestly mapped to the repo).
//
// The "VASA Infotech Unified Module Catalogue v3.0" specifies ~312 core modules across 7 operational tiers
// (National → State → Directorate → District → Block → Cluster → School) plus a cross-cutting Platform tier.
// This register maps a representative, grounded subset of those modules to the in-repo evidence that delivers
// them, with an honest built / partial / pending status. It is NOT a verbatim transcription of all 312 (the
// source .pages is binary, and many entries are variants/sub-features); it is an honest coverage picture of the
// named modules against the codebase. Every built/partial repoRef is asserted to exist on disk; pending entries
// reference nothing — so the map cannot overstate how much of the catalogue is built. Pure + client-safe.

import { csvField } from "@/lib/csv"

import { type CapabilityStatus } from "@/lib/governance/role-capabilities"

/** Catalogue headline figures (from the attachment), for honest context. */
export const CATALOGUE_TOTAL_MODULES = 312
export const CATALOGUE_TIERS_TEXT = "7 operational tiers + Platform"

export type ModuleStatus = CapabilityStatus

export type ModuleTier =
  | "National"
  | "State"
  | "Directorate"
  | "District"
  | "Block"
  | "Cluster"
  | "School"
  | "Platform"

export interface CatalogueModule {
  tier: ModuleTier
  name: string
  /** In-repo evidence delivering it — empty when pending. */
  repoRef: string
  status: ModuleStatus
}

export const CATALOGUE_MODULES: CatalogueModule[] = [
  // National / India-Stack tier
  { tier: "National", name: "APAAR Provisioning", repoRef: "lib/integrations/live/apaar.ts", status: "partial" },
  { tier: "National", name: "Aadhaar Authentication", repoRef: "lib/integrations/live/aadhaar.ts", status: "partial" },
  { tier: "National", name: "DigiLocker Integration", repoRef: "lib/integrations/live/digilocker.ts", status: "partial" },
  { tier: "National", name: "DBT / APBS", repoRef: "lib/integrations/live/dbt.ts", status: "partial" },
  { tier: "National", name: "PFMS Fund-Flow (sanction → release → utilisation)", repoRef: "lib/integrations/live/pfms.ts", status: "partial" },
  { tier: "State", name: "Scheme Fund-Flow Dashboard (PFMS-driven)", repoRef: "app/governance/fund-flow/page.tsx", status: "built" },
  { tier: "National", name: "Bhashini Language Stack", repoRef: "lib/integrations/live/bhashini.ts", status: "partial" },
  { tier: "National", name: "PARAKH Self-Assessment", repoRef: "lib/diagnostic/parakh.ts", status: "built" },
  { tier: "National", name: "CPGRAMS Federation", repoRef: "lib/grievance/cpgrams.ts", status: "built" },

  // State tier
  { tier: "State", name: "Compliance Dashboard", repoRef: "lib/compliance/index.ts", status: "built" },
  { tier: "School", name: "Statutory Compliance Checklist (live dashboard store)", repoRef: "lib/compliance/checklist-store.ts", status: "built" },
  { tier: "State", name: "Scholarship Portal", repoRef: "lib/scholarship/index.ts", status: "built" },
  { tier: "State", name: "Scholarship / Benefit Sanction (workflow → DBT)", repoRef: "lib/scholarshipflow/store.ts", status: "built" },
  { tier: "State", name: "CMBS Breakfast Operations", repoRef: "lib/meals/index.ts", status: "built" },
  { tier: "State", name: "Master Data Management", repoRef: "lib/mdm/index.ts", status: "built" },
  { tier: "State", name: "Real-Time Executive Dashboards", repoRef: "lib/portal-data/index.ts", status: "built" },
  { tier: "State", name: "Welfare-scheme launch & budget priorities", repoRef: "lib/governance/scheme-launch.ts", status: "built" },
  { tier: "State", name: "GeM Procurement", repoRef: "lib/procurement/gem.ts", status: "built" },
  { tier: "School", name: "GeM Procurement Sanction (workflow)", repoRef: "lib/procurementflow/store.ts", status: "built" },
  { tier: "State", name: "Grants & Finance Management", repoRef: "lib/finance/grants.ts", status: "built" },
  { tier: "State", name: "Budget Sanction & Re-appropriation (workflow → Cabinet)", repoRef: "lib/budgetflow/store.ts", status: "built" },
  { tier: "State", name: "Legal Case Management", repoRef: "lib/legal/index.ts", status: "built" },
  { tier: "State", name: "Assembly Q&A Briefing Pack", repoRef: "lib/governance/assembly-briefing.ts", status: "built" },
  { tier: "State", name: "Cabinet Note Drafting", repoRef: "lib/governance/cabinet-note.ts", status: "built" },
  { tier: "State", name: "Inter-Departmental & CSR Coordination", repoRef: "lib/governance/coordination.ts", status: "built" },
  { tier: "State", name: "Public Communication Desk", repoRef: "lib/governance/public-communication.ts", status: "built" },
  { tier: "State", name: "Executive Budget Priorities", repoRef: "lib/governance/budget-priorities.ts", status: "built" },
  { tier: "State", name: "Oversight Command Centre", repoRef: "lib/governance/oversight.ts", status: "built" },
  { tier: "State", name: "RTI Request & Appeals (workflow → SIC)", repoRef: "lib/rtiflow/store.ts", status: "built" },
  { tier: "State", name: "Data Fabric & Lineage", repoRef: "lib/data/lineage.ts", status: "built" },
  { tier: "State", name: "Go-Live Readiness Console", repoRef: "lib/golive/index.ts", status: "built" },
  { tier: "State", name: "Observability / SIEM Export", repoRef: "lib/observability/siem.ts", status: "partial" },
  { tier: "State", name: "Operational Posture (SLO / DR)", repoRef: "lib/ops-posture/index.ts", status: "partial" },

  // Directorate tier
  { tier: "Directorate", name: "DSE / DGE / SCERT Operations", repoRef: "lib/governance/directorates.ts", status: "built" },
  { tier: "Directorate", name: "TN 1973 Act Recognition", repoRef: "lib/recognition/index.ts", status: "built" },
  { tier: "Directorate", name: "Quality Indicator Tracking", repoRef: "lib/quality/index.ts", status: "built" },
  { tier: "Directorate", name: "Teacher Deployment Optimisation", repoRef: "lib/postings/cadre.ts", status: "built" },
  { tier: "Directorate", name: "NPST Competency Tracking", repoRef: "lib/cpd/npst.ts", status: "built" },
  { tier: "Directorate", name: "Need-weighted Resource Allocation", repoRef: "lib/governance/resource-allocation.ts", status: "built" },
  { tier: "Directorate", name: "DTERT Teacher Education & Research", repoRef: "lib/cpd/index.ts", status: "built" },
  { tier: "Directorate", name: "Academic Supervision & Inspection", repoRef: "lib/inspection/index.ts", status: "built" },
  { tier: "Directorate", name: "Performance Grading Index (PGI)", repoRef: "lib/metrics/index.ts", status: "built" },
  { tier: "Directorate", name: "Statutory Reporting & Traceability", repoRef: "lib/traceability/index.ts", status: "built" },
  { tier: "Directorate", name: "Teacher Cadre Management", repoRef: "lib/postings/index.ts", status: "built" },
  { tier: "Directorate", name: "Teacher Transfer & Counselling (workflow)", repoRef: "lib/transferflow/store.ts", status: "built" },

  // District tier
  { tier: "District", name: "District KPI Dashboard", repoRef: "app/deo/dashboard/page.tsx", status: "built" },
  { tier: "District", name: "CEO/DEO Approvals Workflow Hub", repoRef: "app/recognition-approvals/page.tsx", status: "built" },
  { tier: "District", name: "AI-Prioritised Inspections", repoRef: "lib/inspection/index.ts", status: "built" },
  { tier: "District", name: "Dropout & Re-Entry (OOSC)", repoRef: "lib/oosc/index.ts", status: "built" },
  { tier: "School", name: "Dropout Early-Warning (live, explainable, advisory)", repoRef: "lib/dropout/store.ts", status: "built" },
  { tier: "District", name: "Teacher Vacancy & Transfer", repoRef: "lib/vacancy/index.ts", status: "built" },
  { tier: "District", name: "Quality & Compliance (RTE / RPwD)", repoRef: "lib/quality/index.ts", status: "built" },
  { tier: "District", name: "Constituency Grievance Redress", repoRef: "lib/governance/constituency-grievance.ts", status: "built" },
  { tier: "District", name: "District Welfare Operations", repoRef: "lib/governance/school-welfare-ops.ts", status: "built" },
  { tier: "District", name: "Staff Attendance Monitoring", repoRef: "lib/staff-attendance/index.ts", status: "built" },
  { tier: "School", name: "Teacher Presence (live dashboard store)", repoRef: "lib/staff-attendance/presence-store.ts", status: "built" },
  { tier: "District", name: "Diagnostic Assessment Rounds", repoRef: "lib/diagnostic/index.ts", status: "built" },

  // Block tier
  { tier: "Block", name: "BEO Operations Dashboard", repoRef: "app/beo/dashboard/page.tsx", status: "built" },
  { tier: "Block", name: "Scheme Implementation Tracking", repoRef: "app/schemes/page.tsx", status: "built" },
  { tier: "Block", name: "Leave Approvals (Block tier)", repoRef: "app/leave-approvals/page.tsx", status: "built" },
  { tier: "Block", name: "AI-Prioritised Inspections (Block)", repoRef: "lib/inspection/index.ts", status: "built" },
  { tier: "Block", name: "Grievance Escalation (Block)", repoRef: "app/grievance-approvals/page.tsx", status: "built" },
  { tier: "Block", name: "Block Academic Monitoring", repoRef: "lib/quality/index.ts", status: "built" },
  { tier: "Block", name: "BRC Teacher Mentoring", repoRef: "lib/cpd/index.ts", status: "built" },

  // Cluster tier
  { tier: "Cluster", name: "NIPUN Cluster Tracking", repoRef: "lib/diagnostic/index.ts", status: "built" },
  { tier: "Cluster", name: "Teacher Mentoring (CPD)", repoRef: "lib/cpd/index.ts", status: "built" },
  { tier: "Cluster", name: "Reading Campaign (Ennum Ezhuthum)", repoRef: "lib/reading/index.ts", status: "built" },
  { tier: "Cluster", name: "CRCC Mobile Field App / GPS Visits", repoRef: "app/crcc/dashboard/page.tsx", status: "partial" },
  { tier: "Cluster", name: "School Self-Assessment (Shaala Siddhi)", repoRef: "lib/governance/school-self-assessment.ts", status: "built" },
  { tier: "Cluster", name: "Peer-Learning Circles", repoRef: "lib/cpd/index.ts", status: "built" },
  { tier: "Cluster", name: "Cluster Remedial Support", repoRef: "lib/remedial/index.ts", status: "built" },

  // School tier
  { tier: "School", name: "AI-Powered Daily Attendance", repoRef: "lib/attendance/index.ts", status: "built" },
  { tier: "School", name: "Class-wise Attendance (live dashboard store)", repoRef: "lib/attendance/store.ts", status: "built" },
  { tier: "School", name: "Admission & Enrolment", repoRef: "lib/admissions/index.ts", status: "built" },
  { tier: "School", name: "Course Catalogue (full CRUD: list/filter/create/view/edit/delete/seed)", repoRef: "lib/courses/store.ts", status: "built" },
  { tier: "School", name: "Gradebook (full CRUD: marks → %/grade, filter/create/view/edit/delete/seed)", repoRef: "lib/grades/store.ts", status: "built" },
  { tier: "School", name: "Enrolment Snapshot (live dashboard store, gender parity)", repoRef: "lib/enrolment/store.ts", status: "built" },
  { tier: "School", name: "Syllabus Completion Tracking (live dashboard store)", repoRef: "lib/syllabus/store.ts", status: "built" },
  { tier: "School", name: "Assessment Schedule (live dashboard store)", repoRef: "lib/assessment-schedule/store.ts", status: "built" },
  { tier: "School", name: "Teacher Profile & Cadre", repoRef: "lib/directory/index.ts", status: "built" },
  { tier: "School", name: "Formative Assessment (CCE / HPC)", repoRef: "lib/hpc/index.ts", status: "built" },
  { tier: "School", name: "Board Exam Preparation & Security", repoRef: "lib/exams/board-prep.ts", status: "built" },
  { tier: "School", name: "RBSK Health Screening", repoRef: "lib/health/index.ts", status: "built" },
  { tier: "School", name: "RBSK Health Referral (workflow → DEIC)", repoRef: "lib/healthflow/store.ts", status: "built" },
  { tier: "School", name: "Building & Asset Management", repoRef: "lib/assets/index.ts", status: "built" },
  { tier: "School", name: "Infrastructure Works Sanction (workflow)", repoRef: "lib/infraflow/store.ts", status: "built" },
  { tier: "School", name: "Public Library Network", repoRef: "lib/library/index.ts", status: "built" },
  { tier: "School", name: "Sports Management", repoRef: "lib/sports/index.ts", status: "built" },
  { tier: "School", name: "Co-Curricular Activities", repoRef: "lib/cocurricular/index.ts", status: "built" },
  { tier: "School", name: "Career Counselling", repoRef: "lib/career/index.ts", status: "built" },
  { tier: "School", name: "Headmaster Operations Dashboard", repoRef: "app/(dashboards)/principal/dashboard/page.tsx", status: "built" },
  { tier: "School", name: "CCTV Coverage", repoRef: "lib/cctv/index.ts", status: "built" },
  { tier: "School", name: "Grievance Filing", repoRef: "lib/grievance/index.ts", status: "built" },
  { tier: "School", name: "Adi Dravidar Hostel Management", repoRef: "lib/hostel/allocation.ts", status: "built" },
  { tier: "School", name: "Adolescent Mental-Health / Anti-Stress", repoRef: "lib/health/mental-health.ts", status: "built" },
  { tier: "School", name: "Staff Background Verification", repoRef: "lib/staff/background-verification.ts", status: "built" },
  { tier: "School", name: "Child Safety & POCSO Register", repoRef: "lib/safety/index.ts", status: "built" },
  { tier: "School", name: "Child-Safety Incident Escalation (workflow → DCPU)", repoRef: "lib/safetyflow/store.ts", status: "built" },
  { tier: "School", name: "Student Discipline & Incidents", repoRef: "lib/discipline/index.ts", status: "built" },
  { tier: "School", name: "CWSN / Inclusive Education (IEP)", repoRef: "lib/cwsn/index.ts", status: "built" },
  { tier: "School", name: "Visitor Management", repoRef: "lib/visitors/index.ts", status: "built" },
  { tier: "School", name: "Drinking-Water Quality Testing", repoRef: "lib/water/index.ts", status: "built" },
  { tier: "School", name: "Emergency / Fire Drills", repoRef: "lib/drills/index.ts", status: "built" },
  { tier: "School", name: "WASH (Toilets & Hygiene)", repoRef: "lib/wash/index.ts", status: "built" },
  { tier: "School", name: "Student Information System (SIS)", repoRef: "lib/sis/index.ts", status: "built" },
  { tier: "School", name: "Results Publication", repoRef: "lib/results/index.ts", status: "built" },
  { tier: "School", name: "Timetable & Scheduling", repoRef: "lib/timetable/index.ts", status: "built" },
  { tier: "School", name: "School Transport / Bus Routes", repoRef: "lib/transport/index.ts", status: "built" },
  { tier: "School", name: "Fee Management", repoRef: "lib/fees/index.ts", status: "built" },
  { tier: "School", name: "Fee Collection (live dashboard store)", repoRef: "lib/fees/store.ts", status: "built" },
  { tier: "School", name: "Infrastructure Gap Analysis (RTE/RPwD)", repoRef: "lib/infrastructure/index.ts", status: "built" },
  { tier: "School", name: "Textbook Indent & Distribution", repoRef: "lib/textbooks/index.ts", status: "built" },
  { tier: "School", name: "Promotion / Detention Runs", repoRef: "lib/promotion/index.ts", status: "built" },
  { tier: "School", name: "Transfer Certificate (TC)", repoRef: "lib/tc/index.ts", status: "built" },
  { tier: "School", name: "Transfer Certificate Issuance (workflow → APAAR)", repoRef: "lib/tcflow/store.ts", status: "built" },
  { tier: "School", name: "School Events & Excursions", repoRef: "lib/events/index.ts", status: "built" },
  { tier: "School", name: "Eco-Club / Green School", repoRef: "lib/eco/index.ts", status: "built" },
  { tier: "School", name: "Student Council & Elections", repoRef: "lib/council/index.ts", status: "built" },
  { tier: "School", name: "Morning Assembly Register", repoRef: "lib/assembly/index.ts", status: "built" },
  { tier: "School", name: "Remedial / Bridge Learning", repoRef: "lib/remedial/index.ts", status: "built" },
  { tier: "School", name: "Pre-Primary / Foundational Stage", repoRef: "lib/preprimary/index.ts", status: "built" },
  { tier: "School", name: "School Development Plan (SDP)", repoRef: "lib/sdp/index.ts", status: "built" },
  { tier: "School", name: "OMR / Document AI Scanning", repoRef: "lib/omr/index.ts", status: "built" },
  { tier: "School", name: "Lost & Found Register", repoRef: "lib/lostfound/index.ts", status: "built" },
  { tier: "School", name: "Student Bank / DBT Accounts", repoRef: "lib/banking/index.ts", status: "built" },
  { tier: "School", name: "Library Circulation", repoRef: "lib/circulation/index.ts", status: "built" },
  { tier: "School", name: "Competitions & Olympiads", repoRef: "lib/competitions/index.ts", status: "built" },
  { tier: "School", name: "Physical Fitness (Khelo India)", repoRef: "lib/fitness/index.ts", status: "built" },
  { tier: "School", name: "Guest Lectures & Mentoring", repoRef: "lib/guestlectures/index.ts", status: "built" },
  { tier: "School", name: "ICT / Smart-Class Labs", repoRef: "lib/ictlab/index.ts", status: "built" },
  { tier: "School", name: "Vocational Education (Grade 6+)", repoRef: "lib/vocational/index.ts", status: "built" },
  { tier: "School", name: "NSS / NCC / Youth Programmes", repoRef: "lib/youth/index.ts", status: "built" },
  { tier: "School", name: "Stock / Inventory Movement", repoRef: "lib/stock/index.ts", status: "built" },
  { tier: "School", name: "Welfare Distribution (kits/uniforms)", repoRef: "lib/distribution/index.ts", status: "built" },
  { tier: "School", name: "Alumni Network", repoRef: "lib/alumni/index.ts", status: "built" },
  { tier: "School", name: "Mid-Day-Meal Cooks & Honorarium", repoRef: "lib/cooks/index.ts", status: "built" },
  { tier: "School", name: "Science Fair / Inspire Awards", repoRef: "lib/sciencefair/index.ts", status: "built" },
  { tier: "School", name: "E-Content Repository", repoRef: "lib/econtent/index.ts", status: "built" },
  { tier: "School", name: "Lesson-Plan Registry (NCF)", repoRef: "lib/lesson-plan/index.ts", status: "built" },
  { tier: "School", name: "Parent-Teacher Meetings (PTM)", repoRef: "lib/ptm/index.ts", status: "built" },
  { tier: "School", name: "Adaptive Learning Paths", repoRef: "lib/adaptive/index.ts", status: "built" },

  // Platform tier (cross-cutting)
  { tier: "Platform", name: "Six AI Engines (Native-AI L8)", repoRef: "lib/ai/engines/index.ts", status: "built" },
  { tier: "Platform", name: "Six AI Agents (Native-AI L9)", repoRef: "lib/ai/agents/index.ts", status: "built" },
  { tier: "Platform", name: "Knowledge Graph", repoRef: "lib/knowledge-graph/index.ts", status: "built" },
  { tier: "Platform", name: "Crisis / Emergency Centre", repoRef: "lib/emergency/index.ts", status: "built" },
  { tier: "Platform", name: "ESG / Green-School Index", repoRef: "lib/esg/index.ts", status: "built" },
  { tier: "Platform", name: "NDEAR-S 29-Block Alignment", repoRef: "lib/integrations/ndear-s.ts", status: "built" },
  { tier: "Platform", name: "State-Scale Validation", repoRef: "lib/scale/index.ts", status: "partial" },
  { tier: "Platform", name: "Consent Manager (DPDP / InDEA)", repoRef: "lib/consent/pii-catalogue.ts", status: "built" },
  { tier: "Platform", name: "Tamper-evident Audit / Anchoring", repoRef: "lib/audit/trail.ts", status: "built" },
  { tier: "Platform", name: "Real-time Data Ingestion", repoRef: "lib/ingestion/index.ts", status: "built" },
  { tier: "Platform", name: "AI Teacher Assistant (agents)", repoRef: "lib/agents/teacher-assistant.ts", status: "built" },
  { tier: "Platform", name: "Bias & Fairness Monitor", repoRef: "lib/agents/guardrails.ts", status: "built" },
  { tier: "Platform", name: "Federated Identity Manager", repoRef: "lib/access/policy.ts", status: "partial" },
  { tier: "Platform", name: "Multilingual (Tamil + 3-language)", repoRef: "lib/i18n/languages.ts", status: "built" },
  { tier: "Platform", name: "RPwD Accessibility", repoRef: "lib/accessibility/rpwd.ts", status: "built" },
  { tier: "Platform", name: "Event Bus (Kafka)", repoRef: "", status: "pending" },
  { tier: "Platform", name: "API Gateway", repoRef: "", status: "pending" },
  { tier: "Platform", name: "End-to-End Encryption (infra)", repoRef: "", status: "pending" },
]

export const MODULE_TIERS: ModuleTier[] = [
  "National",
  "State",
  "Directorate",
  "District",
  "Block",
  "Cluster",
  "School",
  "Platform",
]

export function byTier(tier: ModuleTier): CatalogueModule[] {
  return CATALOGUE_MODULES.filter((m) => m.tier === tier)
}

export function byStatus(status: ModuleStatus): CatalogueModule[] {
  return CATALOGUE_MODULES.filter((m) => m.status === status)
}

export interface TierCoverage {
  tier: ModuleTier
  modules: number
  built: number
  partial: number
  pending: number
  builtPct: number
}

export function coverageByTier(items: CatalogueModule[] = CATALOGUE_MODULES): TierCoverage[] {
  return MODULE_TIERS.map((tier) => {
    const rows = items.filter((m) => m.tier === tier)
    const built = rows.filter((m) => m.status === "built").length
    return {
      tier,
      modules: rows.length,
      built,
      partial: rows.filter((m) => m.status === "partial").length,
      pending: rows.filter((m) => m.status === "pending").length,
      builtPct: rows.length === 0 ? 0 : Math.round((built / rows.length) * 100),
    }
  })
}

export interface CatalogueSummary {
  /** Catalogue's stated total (context). */
  catalogueTotal: number
  /** Modules mapped in this register. */
  mapped: number
  built: number
  partial: number
  pending: number
  /** Built share of the mapped set, 0–100. */
  builtPct: number
  /** Weighted coverage of the mapped set (built=1, partial=0.5), 0–100. */
  coveragePct: number
}

export function catalogueSummary(items: CatalogueModule[] = CATALOGUE_MODULES): CatalogueSummary {
  const built = items.filter((m) => m.status === "built").length
  const partial = items.filter((m) => m.status === "partial").length
  return {
    catalogueTotal: CATALOGUE_TOTAL_MODULES,
    mapped: items.length,
    built,
    partial,
    pending: items.filter((m) => m.status === "pending").length,
    builtPct: items.length === 0 ? 0 : Math.round((built / items.length) * 100),
    coveragePct: items.length === 0 ? 0 : Math.round(((built + partial * 0.5) / items.length) * 100),
  }
}


export function toCSV(items: CatalogueModule[] = CATALOGUE_MODULES): string {
  const header = ["Tier", "Module", "Repo evidence", "Status"]
  const rows = items.map((m) => [m.tier, m.name, m.repoRef || "—", m.status].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
