// VASA-EOS(SE) — Policies demo dataset (shown when no database is configured).
//
// The Policies module is DB-backed (full CRUD + versioning + RBAC). Without a provisioned
// Supabase it would be empty; this pure dataset lets it DEMONSTRATE with representative Tamil
// Nadu / NEP-2020 policy drafts in the credential-free walkthrough. Type-only import (erased
// at runtime) avoids a server/lib import cycle.

import type { PolicyDraft } from "@/app/policies/create/policy-form-constants"

export function policyDemoData(): PolicyDraft[] {
  const base = {
    keywords: [] as string[],
    targetAudience: ["Teachers", "Students", "Administrators"],
    internalReviewCommittee: ["DSE", "DTERT"],
    draftPolicyDocument: null,
    annexures: null,
    status: "Published" as PolicyDraft["status"],
  }
  return [
    {
      ...base,
      id: "demo-sep-2022",
      title: "Tamil Nadu State Education Policy (SEP) 2022",
      policyDomain: "Governance & Reform",
      version: "1.2",
      abstractEN: "The State framework for school education — Tamil-first instruction, equity, and the 5+3+3+4 structure aligned to NEP 2020 with TN safeguards.",
      abstractHI: "தமிழ்நாடு பள்ளிக் கல்விக் கொள்கை — தமிழ் முதன்மை, சமத்துவம்.",
      leadDrafter: "Secretary, School Education",
      nepThrustAreas: ["Equity & Inclusion", "Foundational Literacy & Numeracy"],
      nepAlignmentJustification: "Adopts the 5+3+3+4 structure and FLN priority while preserving Tamil-medium instruction.",
      keywords: ["SEP", "Tamil-first", "equity"],
      createdAt: "2026-01-15T00:00:00.000Z",
      lastModified: "2026-05-20T00:00:00.000Z",
    },
    {
      ...base,
      id: "demo-nipun-tn",
      title: "NIPUN Tamil Nadu — Foundational Literacy & Numeracy Mission",
      policyDomain: "Foundational Learning",
      version: "2.0",
      abstractEN: "Mission to achieve foundational literacy and numeracy for all children by Grade 3, with Ennum Ezhuthum implementation.",
      abstractHI: "மூன்றாம் வகுப்புக்குள் அடிப்படை எழுத்தறிவு மற்றும் எண்ணறிவு.",
      leadDrafter: "Director, DTERT",
      nepThrustAreas: ["Foundational Literacy & Numeracy"],
      nepAlignmentJustification: "Directly operationalises NIPUN Bharat under the TN 'Ennum Ezhuthum' programme.",
      keywords: ["FLN", "NIPUN", "Ennum Ezhuthum"],
      createdAt: "2026-02-02T00:00:00.000Z",
      lastModified: "2026-05-28T00:00:00.000Z",
    },
    {
      ...base,
      id: "demo-itk",
      title: "Illam Thedi Kalvi — Education at the Doorstep",
      policyDomain: "Equity & Access",
      version: "1.0",
      abstractEN: "Community-based volunteer learning to remediate pandemic learning loss, reaching children in their neighbourhoods.",
      abstractHI: "இல்லம் தேடி கல்வி — வீட்டருகே கற்றல்.",
      leadDrafter: "Director, DEE",
      nepThrustAreas: ["Equity & Inclusion"],
      nepAlignmentJustification: "Addresses learning loss and equity through community volunteers.",
      keywords: ["remediation", "equity", "volunteers"],
      status: "Under Review" as PolicyDraft["status"],
      createdAt: "2026-03-10T00:00:00.000Z",
      lastModified: "2026-06-01T00:00:00.000Z",
    },
    {
      ...base,
      id: "demo-rte-25",
      title: "RTE 25% Admissions — Implementation Guidelines",
      policyDomain: "Rights & Entitlements",
      version: "1.4",
      abstractEN: "Operational guidelines for the 25% reservation for EWS/disadvantaged groups under RTE §12(1)(c), including reimbursement.",
      abstractHI: "கல்வி உரிமைச் சட்டம் 25% சேர்க்கை வழிகாட்டுதல்கள்.",
      leadDrafter: "Joint Secretary, School Education",
      nepThrustAreas: ["Equity & Inclusion"],
      nepAlignmentJustification: "Implements the RTE 2009 statutory entitlement.",
      keywords: ["RTE", "EWS", "admissions"],
      createdAt: "2026-01-28T00:00:00.000Z",
      lastModified: "2026-04-30T00:00:00.000Z",
    },
    {
      ...base,
      id: "demo-naan-mudhalvan",
      title: "Naan Mudhalvan — Skills & Career Readiness",
      policyDomain: "Vocational & Skilling",
      version: "1.1",
      abstractEN: "Skills, career guidance and industry readiness for higher-secondary students across Tamil Nadu.",
      abstractHI: "நான் முதல்வன் — திறன் மற்றும் தொழில் தயார்நிலை.",
      leadDrafter: "Director, DSE",
      nepThrustAreas: ["Vocational & Skilling", "Digital & Technology"],
      nepAlignmentJustification: "Operationalises vocational exposure from the secondary stage per NEP 2020.",
      keywords: ["skills", "career", "vocational"],
      status: "Draft" as PolicyDraft["status"],
      createdAt: "2026-03-22T00:00:00.000Z",
      lastModified: "2026-06-05T00:00:00.000Z",
    },
  ]
}
