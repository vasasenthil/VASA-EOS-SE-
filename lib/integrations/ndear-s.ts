// VASA-EOS(SE) — NDEAR-S building-block register (29/29 alignment, brochure claim).
//
// NDEAR-S (the Schools profile of the National Digital Education Architecture) unbundles the
// ecosystem into building blocks. This register maps all 29 to the in-repo component that
// addresses each, with an HONEST status: "built" (real, tested logic in-repo), "federated-
// seam" (a typed adapter, mock by default and live only when env-configured — the registries
// the State federates with, not re-implemented), or "pending" (not yet built). Every built /
// federated-seam row cites a path asserted to exist on disk (tests/ndear-s.test.ts); pending
// rows cite nothing. "29/29 aligned" means all 29 are addressed — not that all are live.

import { csvField } from "@/lib/csv"

export type NdearSStatus = "built" | "federated-seam" | "pending"

export type NdearSCategory =
  | "Identity & access"
  | "Registries & data"
  | "Content & learning"
  | "Assessment & credentials"
  | "Welfare & finance"
  | "Engagement"
  | "Trust & governance"

export interface NdearSBlock {
  id: string
  n: number
  category: NdearSCategory
  name: string
  requirement: string
  status: NdearSStatus
  componentRef: string
}

export const NDEAR_S_BLOCKS: NdearSBlock[] = [
  // Identity & access
  { id: "learner-id", n: 1, category: "Identity & access", name: "Learner identity (APAAR)", requirement: "Federated lifelong learner ID", status: "federated-seam", componentRef: "lib/integrations/live/apaar.ts" },
  { id: "educator-id", n: 2, category: "Identity & access", name: "Educator identity & service record", requirement: "Teacher identity, postings, cadre", status: "built", componentRef: "lib/staff" },
  { id: "institution-registry", n: 3, category: "Identity & access", name: "Institution registry (UDISE+)", requirement: "School registry of record", status: "federated-seam", componentRef: "lib/integrations/live/udise.ts" },
  { id: "auth-sso", n: 4, category: "Identity & access", name: "Authentication & SSO", requirement: "Single sign-on, session, identity binding", status: "federated-seam", componentRef: "lib/auth/current-role.ts" },
  { id: "access-control", n: 5, category: "Identity & access", name: "Access control (RBAC/ABAC/ReBAC)", requirement: "Least-privilege authorisation", status: "built", componentRef: "lib/access/policy.ts" },

  // Registries & data
  { id: "enrolment", n: 6, category: "Registries & data", name: "Student enrolment registry (SIS)", requirement: "Enrolment, demographics, movement", status: "built", componentRef: "lib/sis" },
  { id: "cadre", n: 7, category: "Registries & data", name: "Teacher deployment / cadre", requirement: "Postings, vacancy, rationalisation", status: "built", componentRef: "lib/postings" },
  { id: "course-registry", n: 8, category: "Registries & data", name: "Course / curriculum registry", requirement: "Syllabus, lesson plans, NCF mapping", status: "built", componentRef: "lib/lesson-plan" },
  { id: "master-data", n: 9, category: "Registries & data", name: "Master data & taxonomy", requirement: "Reference data, tenancy taxonomy", status: "built", componentRef: "lib/tenancy/catalogue.ts" },
  { id: "data-lineage", n: 10, category: "Registries & data", name: "Data lineage & quality", requirement: "Provenance, quality, EMIS federation", status: "built", componentRef: "lib/data/lineage.ts" },

  // Content & learning
  { id: "content-backbone", n: 11, category: "Content & learning", name: "Content backbone (DIKSHA)", requirement: "Federated content / energised textbooks", status: "federated-seam", componentRef: "lib/integrations/live/diksha.ts" },
  { id: "econtent", n: 12, category: "Content & learning", name: "Energised textbooks / e-content", requirement: "QR-linked, curated digital content", status: "built", componentRef: "lib/econtent" },
  { id: "learning-paths", n: 13, category: "Content & learning", name: "Personalised learning paths", requirement: "Adaptive next-step sequencing", status: "built", componentRef: "lib/adaptive" },
  { id: "knowledge-graph", n: 14, category: "Content & learning", name: "Knowledge graph", requirement: "Curriculum / career semantic graph", status: "built", componentRef: "lib/knowledge-graph" },
  { id: "fln-reading", n: 15, category: "Content & learning", name: "Foundational literacy & numeracy", requirement: "Reading fluency & FLN tracking", status: "built", componentRef: "lib/reading" },

  // Assessment & credentials
  { id: "item-bank", n: 16, category: "Assessment & credentials", name: "Assessment & item bank", requirement: "Question paper assembly, item bank", status: "built", componentRef: "lib/question-bank/store.ts" },
  { id: "ai-assessment", n: 17, category: "Assessment & credentials", name: "AI assessment & diagnosis", requirement: "Scoring, mastery, weak-spot diagnosis", status: "built", componentRef: "lib/ai/engines/assessment.ts" },
  { id: "hpc", n: 18, category: "Assessment & credentials", name: "Holistic Progress Card", requirement: "360° competency progress card", status: "built", componentRef: "lib/hpc" },
  { id: "credentials", n: 19, category: "Assessment & credentials", name: "Verifiable credentials (DigiLocker)", requirement: "Issue / verify portable credentials", status: "federated-seam", componentRef: "lib/integrations/live/digilocker.ts" },

  // Welfare & finance
  { id: "schemes", n: 20, category: "Welfare & finance", name: "Schemes & eligibility", requirement: "Rule-based entitlement derivation", status: "built", componentRef: "lib/ai/engines/reasoning.ts" },
  { id: "dbt", n: 21, category: "Welfare & finance", name: "Direct benefit transfer (DBT/PFMS)", requirement: "Scheme disbursement to beneficiaries", status: "federated-seam", componentRef: "lib/integrations/live/dbt.ts" },
  { id: "scholarship", n: 22, category: "Welfare & finance", name: "Scholarship & entitlement tracking", requirement: "Application, sanction, tracking", status: "built", componentRef: "lib/scholarship" },

  // Engagement
  { id: "notifications", n: 23, category: "Engagement", name: "Notifications & messaging", requirement: "Multi-channel, own-row notifications", status: "built", componentRef: "lib/notifications/create.ts" },
  { id: "grievance", n: 24, category: "Engagement", name: "Grievance redressal", requirement: "Tiered, audited escalation", status: "built", componentRef: "lib/grievanceflow/store.ts" },
  { id: "multilingual", n: 25, category: "Engagement", name: "Multilingual services (Bhashini)", requirement: "22-language translation / TTS", status: "federated-seam", componentRef: "lib/integrations/live/bhashini.ts" },

  // Trust & governance
  { id: "consent", n: 26, category: "Trust & governance", name: "Consent (DPDP 2023)", requirement: "Grant/withdraw, purpose-bound ledger", status: "built", componentRef: "lib/consent/gate-server.ts" },
  { id: "audit", n: 27, category: "Trust & governance", name: "Audit & transparency", requirement: "Tamper-evident state-change ledger", status: "built", componentRef: "lib/audit/trail.ts" },
  { id: "analytics-vsk", n: 28, category: "Trust & governance", name: "Analytics / VSK dashboards", requirement: "Aggregated decision-support analytics", status: "built", componentRef: "lib/ai/engines/analytics.ts" },
  { id: "accessibility", n: 29, category: "Trust & governance", name: "Accessibility (RPwD / WCAG)", requirement: "21-category accessibility surface", status: "built", componentRef: "lib/accessibility/rpwd.ts" },
]

export const NDEAR_S_CATEGORIES: NdearSCategory[] = [
  "Identity & access",
  "Registries & data",
  "Content & learning",
  "Assessment & credentials",
  "Welfare & finance",
  "Engagement",
  "Trust & governance",
]

export const NDEAR_S_TOTAL = 29

export function byCategory(category: NdearSCategory, items: NdearSBlock[] = NDEAR_S_BLOCKS): NdearSBlock[] {
  return items.filter((b) => b.category === category)
}

export interface NdearSSummary {
  total: number
  built: number
  federatedSeam: number
  pending: number
  /** All 29 are addressed by design; this is the share that is fully built in-repo. */
  builtPct: number
  /** 29/29 addressed (built or a live-ready federated seam). */
  aligned: boolean
}

export function ndearSSummary(items: NdearSBlock[] = NDEAR_S_BLOCKS): NdearSSummary {
  const built = items.filter((b) => b.status === "built").length
  const federatedSeam = items.filter((b) => b.status === "federated-seam").length
  const pending = items.filter((b) => b.status === "pending").length
  const total = items.length
  return {
    total,
    built,
    federatedSeam,
    pending,
    builtPct: total ? Math.round((built / total) * 100) : 0,
    aligned: pending === 0 && total === NDEAR_S_TOTAL,
  }
}

export function toCSV(items: NdearSBlock[] = NDEAR_S_BLOCKS): string {
  const header = ["#", "Category", "Building block", "Requirement", "Status", "Component"]
  const rows = items.map((b) => [String(b.n), b.category, b.name, b.requirement, b.status, b.componentRef].map(csvField).join(","))
  return [header.map(csvField).join(","), ...rows].join("\n")
}
