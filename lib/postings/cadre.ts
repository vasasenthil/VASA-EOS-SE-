// VASA-EOS(SE) — state-tier teacher-cadre / PTR rationalisation (RTE §25 + Schedule).
//
// RTE fixes a pupil-teacher ratio; meeting it statewide is a redeployment problem, not just a hiring one.
// This is the Secretary's rationalisation view: every school's working strength measured against the
// teachers its enrolment requires at the RTE PTR, classifying each as surplus, deficit or balanced, and
// computing a redeployment plan that moves excess teachers from surplus schools to deficit ones (counselling-
// based, the lawful TN mechanism) before any fresh recruitment. Pure + client-safe; the PTR is a parameter.

import { csvField } from "@/lib/csv"

import { type TransferRequest } from "@/lib/postings"

/** RTE Schedule pupil-teacher ratio (state target). */
export const RTE_PTR = 30

export type CadreClass = "surplus" | "deficit" | "balanced"

export interface SchoolCadre {
  school: string
  district: string
  enrolment: number
  /** Sanctioned teacher posts. */
  sanctioned: number
  /** Teachers actually in position. */
  working: number
}

export const SCHOOL_CADRE: SchoolCadre[] = [
  { school: "Govt HSS Madurai", district: "Madurai", enrolment: 300, sanctioned: 12, working: 13 },
  { school: "Govt HS Coimbatore", district: "Coimbatore", enrolment: 450, sanctioned: 16, working: 12 },
  { school: "Govt PS Tiruchirappalli", district: "Tiruchirappalli", enrolment: 120, sanctioned: 5, working: 6 },
  { school: "Govt HSS Salem", district: "Salem", enrolment: 600, sanctioned: 22, working: 18 },
  { school: "Govt MS Chennai", district: "Chennai", enrolment: 240, sanctioned: 9, working: 8 },
  { school: "Govt PS Nilgiris", district: "Nilgiris", enrolment: 90, sanctioned: 4, working: 5 },
  { school: "Govt HS Erode", district: "Erode", enrolment: 510, sanctioned: 18, working: 14 },
  { school: "Govt MS Thanjavur", district: "Thanjavur", enrolment: 270, sanctioned: 10, working: 9 },
]

/** Teachers required to meet the PTR for this enrolment. */
export function requiredTeachers(c: SchoolCadre, ptr: number = RTE_PTR): number {
  return Math.ceil(c.enrolment / ptr)
}

/** Working strength minus requirement: positive = surplus, negative = deficit. */
export function balance(c: SchoolCadre, ptr: number = RTE_PTR): number {
  return c.working - requiredTeachers(c, ptr)
}

/** Unfilled sanctioned posts. */
export function vacancy(c: SchoolCadre): number {
  return c.sanctioned - c.working
}

export function classify(c: SchoolCadre, ptr: number = RTE_PTR): CadreClass {
  const b = balance(c, ptr)
  return b > 0 ? "surplus" : b < 0 ? "deficit" : "balanced"
}

export interface RedeploymentMove {
  from: string
  to: string
  count: number
}

/** Greedy counselling-based plan: move excess from the largest surpluses to the largest deficits. */
export function redeploymentPlan(ptr: number = RTE_PTR, items: SchoolCadre[] = SCHOOL_CADRE): RedeploymentMove[] {
  const surplus = items
    .map((c) => ({ school: c.school, n: balance(c, ptr) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
  const deficit = items
    .map((c) => ({ school: c.school, n: -balance(c, ptr) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
  const moves: RedeploymentMove[] = []
  let si = 0
  let di = 0
  while (si < surplus.length && di < deficit.length) {
    const count = Math.min(surplus[si].n, deficit[di].n)
    if (count > 0) moves.push({ from: surplus[si].school, to: deficit[di].school, count })
    surplus[si].n -= count
    deficit[di].n -= count
    if (surplus[si].n === 0) si++
    if (deficit[di].n === 0) di++
  }
  return moves
}

/** Render the plan as draft counselling-based transfer requests (status: requested). */
export function planToTransferRequests(ptr: number = RTE_PTR, items: SchoolCadre[] = SCHOOL_CADRE): TransferRequest[] {
  return redeploymentPlan(ptr, items).map((m, i) => ({
    id: `RDP-${String(i + 1).padStart(3, "0")}`,
    teacher: `${m.count} surplus post(s)`,
    fromSchool: m.from,
    toSchool: m.to,
    reason: "PTR rationalisation (RTE §25)",
    status: "requested",
  }))
}

export interface CadreSummary {
  schools: number
  surplus: number
  deficit: number
  balanced: number
  surplusPosts: number
  deficitPosts: number
  /** Posts that can be met by redeployment before any fresh recruitment. */
  redeployable: number
  vacancies: number
  /** State-wide pupil-teacher ratio (enrolment ÷ working). */
  statePtr: number
}

export function cadreSummary(ptr: number = RTE_PTR, items: SchoolCadre[] = SCHOOL_CADRE): CadreSummary {
  const surplusPosts = items.reduce((s, c) => s + Math.max(0, balance(c, ptr)), 0)
  const deficitPosts = items.reduce((s, c) => s + Math.max(0, -balance(c, ptr)), 0)
  const enrolment = items.reduce((s, c) => s + c.enrolment, 0)
  const working = items.reduce((s, c) => s + c.working, 0)
  return {
    schools: items.length,
    surplus: items.filter((c) => classify(c, ptr) === "surplus").length,
    deficit: items.filter((c) => classify(c, ptr) === "deficit").length,
    balanced: items.filter((c) => classify(c, ptr) === "balanced").length,
    surplusPosts,
    deficitPosts,
    redeployable: Math.min(surplusPosts, deficitPosts),
    vacancies: items.reduce((s, c) => s + vacancy(c), 0),
    statePtr: working === 0 ? 0 : Math.round(enrolment / working),
  }
}


export function toCSV(ptr: number = RTE_PTR, items: SchoolCadre[] = SCHOOL_CADRE): string {
  const header = ["School", "District", "Enrolment", "Required", "Working", "Vacancy", "Balance", "Class"]
  const rows = items.map((c) =>
    [c.school, c.district, String(c.enrolment), String(requiredTeachers(c, ptr)), String(c.working), String(vacancy(c)), String(balance(c, ptr)), classify(c, ptr)].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
