// VASA-EOS(SE) — Infrastructure & Asset Management (Sec 50 / PM SHRI · Samagra Shiksha).
// School facility inventory, condition grading, and a RTE/RPwD-aligned gap analysis
// (classrooms, drinking water, gender-segregated toilets, electricity, ramps, labs,
// boundary wall). Pure logic; production binds to the asset register behind the seam.

export type Condition = "good" | "fair" | "poor" | "absent"

export interface Facility {
  key: string
  label: string
  required: boolean // RTE / RPwD mandated
  condition: Condition
}

export interface SchoolInfrastructure {
  udise: string
  name: string
  facilities: Facility[]
}

const f = (key: string, label: string, required: boolean, condition: Condition): Facility => ({
  key,
  label,
  required,
  condition,
})

export const INFRASTRUCTURE: SchoolInfrastructure[] = [
  {
    udise: "33010100101",
    name: "GHSS Egmore",
    facilities: [
      f("classrooms", "Classrooms", true, "good"),
      f("water", "Drinking Water", true, "good"),
      f("toilets_girls", "Girls' Toilets", true, "good"),
      f("toilets_boys", "Boys' Toilets", true, "fair"),
      f("electricity", "Electricity", true, "good"),
      f("ramp", "Ramp & Accessibility (RPwD)", true, "fair"),
      f("library", "Library", false, "good"),
      f("computer_lab", "Computer Lab", false, "fair"),
      f("playground", "Playground", false, "good"),
      f("boundary", "Boundary Wall", false, "good"),
    ],
  },
  {
    udise: "33030300303",
    name: "Tribal Welfare School, Nilgiris",
    facilities: [
      f("classrooms", "Classrooms", true, "fair"),
      f("water", "Drinking Water", true, "poor"),
      f("toilets_girls", "Girls' Toilets", true, "poor"),
      f("toilets_boys", "Boys' Toilets", true, "fair"),
      f("electricity", "Electricity", true, "poor"),
      f("ramp", "Ramp & Accessibility (RPwD)", true, "absent"),
      f("library", "Library", false, "absent"),
      f("computer_lab", "Computer Lab", false, "absent"),
      f("playground", "Playground", false, "fair"),
      f("boundary", "Boundary Wall", false, "absent"),
    ],
  },
  {
    udise: "33040400404",
    name: "Govt Matric, Madurai",
    facilities: [
      f("classrooms", "Classrooms", true, "good"),
      f("water", "Drinking Water", true, "fair"),
      f("toilets_girls", "Girls' Toilets", true, "good"),
      f("toilets_boys", "Boys' Toilets", true, "good"),
      f("electricity", "Electricity", true, "good"),
      f("ramp", "Ramp & Accessibility (RPwD)", true, "poor"),
      f("library", "Library", false, "fair"),
      f("computer_lab", "Computer Lab", false, "good"),
      f("playground", "Playground", false, "fair"),
      f("boundary", "Boundary Wall", false, "good"),
    ],
  },
]

const CONDITION_SCORE: Record<Condition, number> = { good: 100, fair: 65, poor: 30, absent: 0 }

export interface InfraSummary {
  schools: number
  avgReadiness: number // 0-100 across required facilities
  mandatedGaps: number // required facilities that are poor/absent
  accessibilityGaps: number // ramp poor/absent
}

/** Readiness for one school = mean condition score of required (RTE/RPwD) facilities. */
export function schoolReadiness(s: SchoolInfrastructure): number {
  const req = s.facilities.filter((x) => x.required)
  if (req.length === 0) return 0
  return Math.round(req.reduce((sum, x) => sum + CONDITION_SCORE[x.condition], 0) / req.length)
}

/** Required facilities that fail to meet standard (poor or absent) for a school. */
export function schoolGaps(s: SchoolInfrastructure): Facility[] {
  return s.facilities.filter((x) => x.required && (x.condition === "poor" || x.condition === "absent"))
}

export function infraSummary(rows: SchoolInfrastructure[] = INFRASTRUCTURE): InfraSummary {
  const readiness = rows.map(schoolReadiness)
  const mandatedGaps = rows.reduce((n, s) => n + schoolGaps(s).length, 0)
  const accessibilityGaps = rows.filter((s) =>
    s.facilities.some((x) => x.key === "ramp" && (x.condition === "poor" || x.condition === "absent")),
  ).length
  return {
    schools: rows.length,
    avgReadiness: Math.round(readiness.reduce((a, b) => a + b, 0) / Math.max(rows.length, 1)),
    mandatedGaps,
    accessibilityGaps,
  }
}
