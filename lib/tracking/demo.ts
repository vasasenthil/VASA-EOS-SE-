// VASA-EOS(SE) — NEP-tracking demo dataset (shown when no database is configured).
//
// The Policy / NEP-implementation tracker is a DB-backed module: with a provisioned
// Supabase it reads live rows; without one it would be empty. This pure dataset lets the
// tracker DEMONSTRATE the dashboard with representative Tamil Nadu NEP-2020 implementation
// data so the feature is visible in the credential-free walkthrough. Marked demo:true so
// the UI can label it. Type-only import (erased at runtime) avoids a server/lib import cycle.

import type {
  TrackerDashboardData,
  TrackerStat,
  PolicyProgressItem,
  NepThrustAreaProgress,
  StateImplementationProgress,
} from "@/app/tracking/dashboard/actions"

const stats: TrackerStat[] = [
  { title: "Policies tracked", value: "6", description: "NEP 2020 priorities in TN" },
  { title: "Average progress", value: "68%", description: "weighted across regions" },
  { title: "Regions reporting", value: "38", description: "all TN districts" },
  { title: "Open challenges", value: "12", description: "3 high severity" },
]

const policyProgress: PolicyProgressItem[] = [
  { id: "nipun", title: "NIPUN Bharat — Foundational Literacy & Numeracy", status: "On Track", progress: 74, statesAffected: 38, lastUpdate: "2026-05-30", implementation_status_id: "demo-1" },
  { id: "structure", title: "5+3+3+4 curricular & pedagogical structure", status: "On Track", progress: 71, statesAffected: 38, lastUpdate: "2026-05-28", implementation_status_id: "demo-2" },
  { id: "mother-tongue", title: "Mother-tongue / Tamil-medium instruction", status: "On Track", progress: 82, statesAffected: 38, lastUpdate: "2026-06-02", implementation_status_id: "demo-3" },
  { id: "vocational", title: "Vocational education from Grade 6", status: "At Risk", progress: 49, statesAffected: 31, lastUpdate: "2026-05-21", implementation_status_id: "demo-4" },
  { id: "teacher-cpd", title: "Teacher CPD — 50 hours / year", status: "Delayed", progress: 38, statesAffected: 27, lastUpdate: "2026-05-12", implementation_status_id: "demo-5" },
  { id: "assessment", title: "Competency-based assessment reform", status: "On Track", progress: 63, statesAffected: 38, lastUpdate: "2026-05-31", implementation_status_id: "demo-6" },
]

const nepThrustAreaProgress: NepThrustAreaProgress[] = [
  { name: "Foundational Literacy & Numeracy", value: 74 },
  { name: "Equity & Inclusion", value: 66 },
  { name: "Teacher Capacity", value: 52 },
  { name: "Digital & Technology", value: 70 },
  { name: "Vocational & Skilling", value: 49 },
  { name: "Assessment Reform", value: 63 },
]

const stateImplementationProgress: StateImplementationProgress[] = [
  { id: "chennai", name: "Chennai", value: 76, policiesTracked: 6 },
  { id: "coimbatore", name: "Coimbatore", value: 72, policiesTracked: 6 },
  { id: "madurai", name: "Madurai", value: 67, policiesTracked: 6 },
  { id: "salem", name: "Salem", value: 64, policiesTracked: 6 },
  { id: "nilgiris", name: "The Nilgiris", value: 58, policiesTracked: 6 },
  { id: "thanjavur", name: "Thanjavur", value: 61, policiesTracked: 6 },
]

export function trackerDemoData(): TrackerDashboardData {
  return {
    stats,
    policyProgress,
    nepThrustAreaProgress,
    stateImplementationProgress,
    distinctStatuses: ["On Track", "At Risk", "Delayed", "Completed"],
    distinctRegionTypes: ["State", "District", "Block"],
    demo: true,
  }
}
