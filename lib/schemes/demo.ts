// VASA-EOS(SE) — Schemes demo dataset (shown when no database is configured).
//
// The Schemes module is DB-backed (full CRUD + categories + RBAC). Without a provisioned
// Supabase it would be empty; this pure dataset lets it DEMONSTRATE with real Tamil Nadu
// welfare schemes in the credential-free walkthrough. Type-only import (erased at runtime)
// avoids a server/lib import cycle.

import type { Scheme } from "@/app/schemes/types"

function scheme(over: Partial<Scheme> & Pick<Scheme, "id" | "name" | "status">): Scheme {
  return {
    description: null,
    objectives: null,
    scheme_code: null,
    category_id: null,
    issuing_authority_ou_id: null,
    funding_pattern: null,
    total_budget: null,
    budget_year: "2025-2026",
    start_date: null,
    end_date: null,
    target_beneficiaries: null,
    eligibility_criteria: null,
    website_url: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-05-01T00:00:00.000Z",
    category: null,
    issuing_authority_ou: null,
    documents: [],
    applicable_ou_subtypes: [],
    target_governance_tiers: [],
    ...over,
  }
}

export function schemeDemoData(): Scheme[] {
  return [
    scheme({ id: "demo-pudhumai-penn", name: "Pudhumai Penn", status: "Active", scheme_code: "TN-PP", description: "Monthly assistance for girls from government schools pursuing higher education.", funding_pattern: "State", target_beneficiaries: "Girls who studied Classes 6–12 in government schools", total_budget: 6980000000 }),
    scheme({ id: "demo-cmbs", name: "Chief Minister's Breakfast Scheme (CMBS)", status: "Active", scheme_code: "TN-CMBS", description: "Free, nutritious breakfast for government-school children to improve attendance and nutrition.", funding_pattern: "State", target_beneficiaries: "Govt primary & upper-primary students", total_budget: 5000000000 }),
    scheme({ id: "demo-naan-mudhalvan", name: "Naan Mudhalvan", status: "Active", scheme_code: "TN-NM", description: "Skills, career guidance and industry readiness for higher-secondary students.", funding_pattern: "State + CSR", target_beneficiaries: "Class 9–12 students" }),
    scheme({ id: "demo-itk", name: "Illam Thedi Kalvi", status: "Active", scheme_code: "TN-ITK", description: "Community-based volunteer learning to remediate learning loss at the doorstep.", funding_pattern: "State", target_beneficiaries: "Classes 1–8 children" }),
    scheme({ id: "demo-cycle", name: "Free Bicycle Scheme", status: "Active", scheme_code: "TN-CYC", description: "Free bicycles to higher-secondary students to improve access and retention.", funding_pattern: "State", target_beneficiaries: "Class 11 government-school students" }),
    scheme({ id: "demo-mdm", name: "PM POSHAN (Mid-Day Meal)", status: "Active", scheme_code: "TN-MDM", description: "Hot cooked mid-day meals supporting nutrition and enrolment.", funding_pattern: "Centre + State", target_beneficiaries: "Classes 1–8 children", total_budget: 32000000000 }),
  ]
}
