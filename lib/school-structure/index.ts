// VASA-EOS(SE) — explicit NEP 2020 5+3+3+4 school-stage model + TN school-category
// registry dimension. Pure data + helpers (client-safe) so dashboards, SIS and
// reports can classify grades into stages and schools into categories consistently.

// ── 5+3+3+4 curricular & pedagogical stages (NEP 2020) ───────────────────────
export type StageCode = "foundational" | "preparatory" | "middle" | "secondary"

export interface SchoolStage {
  code: StageCode
  name: string
  /** Span label, e.g. "5 years". */
  span: string
  /** Inclusive grade band; grade 0 denotes pre-primary (Anganwadi/Balvatika). */
  grades: number[]
  /** Typical age band [min, maxExclusive). */
  ageRange: [number, number]
  focus: string
}

export const SCHOOL_STAGES: SchoolStage[] = [
  { code: "foundational", name: "Foundational", span: "5 years (3 pre-primary + Grades 1–2)", grades: [0, 1, 2], ageRange: [3, 8], focus: "Play/activity-based FLN (NIPUN Bharat)" },
  { code: "preparatory", name: "Preparatory", span: "3 years (Grades 3–5)", grades: [3, 4, 5], ageRange: [8, 11], focus: "Discovery learning, reading & numeracy" },
  { code: "middle", name: "Middle", span: "3 years (Grades 6–8)", grades: [6, 7, 8], ageRange: [11, 14], focus: "Subject concepts, vocational exposure" },
  { code: "secondary", name: "Secondary", span: "4 years (Grades 9–12)", grades: [9, 10, 11, 12], ageRange: [14, 18], focus: "Multidisciplinary, board exams, electives" },
]

/** The NEP stage that owns a grade (0 = pre-primary), or undefined if out of range. */
export function stageForGrade(grade: number): SchoolStage | undefined {
  return SCHOOL_STAGES.find((s) => s.grades.includes(grade))
}

/** The NEP stage for an age, or undefined if outside 3–18. */
export function stageForAge(age: number): SchoolStage | undefined {
  return SCHOOL_STAGES.find((s) => age >= s.ageRange[0] && age < s.ageRange[1])
}

// ── School-category registry dimension (TN) ──────────────────────────────────
// `management` aligns with lib/domain SchoolManagement; `funding` groups for
// budget/funding rollups; `board` indicates the examination/affiliation board.
export type Management = "government" | "local_body" | "aided" | "private_unaided" | "central"
export type Funding = "state" | "local" | "state-aided" | "self-financed" | "central"

export interface SchoolCategory {
  code: string
  name: string
  management: Management
  funding: Funding
  board: string
  note: string
}

export const SCHOOL_CATEGORIES: SchoolCategory[] = [
  { code: "government", name: "Government", management: "government", funding: "state", board: "State (TN SCERT)", note: "Run directly by the State (DSE/DEE)." },
  { code: "local_body", name: "Local Body", management: "local_body", funding: "local", board: "State (TN SCERT)", note: "Panchayat Union / Municipal / Corporation schools." },
  { code: "aided", name: "Government Aided", management: "aided", funding: "state-aided", board: "State (TN SCERT)", note: "Private management, salaries grant-in-aid by the State." },
  { code: "private_unaided", name: "Private Unaided", management: "private_unaided", funding: "self-financed", board: "State / CBSE / ICSE", note: "Self-financed private management." },
  { code: "matriculation", name: "Matriculation", management: "private_unaided", funding: "self-financed", board: "Matriculation (TN)", note: "TN Matriculation Board schools." },
  { code: "cbse_icse", name: "CBSE / ICSE / Other Boards", management: "private_unaided", funding: "self-financed", board: "CBSE / ICSE / IB / others", note: "Affiliated to a non-state board." },
  { code: "minority", name: "Minority", management: "aided", funding: "state-aided", board: "State / CBSE", note: "Art. 30 minority-administered institutions." },
  { code: "special", name: "Residential / Model / Special", management: "government", funding: "state", board: "State / CBSE", note: "Adi Dravidar / Kallar / Model / CWSN-special residential schools." },
  { code: "central", name: "Central Govt Schools", management: "central", funding: "central", board: "CBSE", note: "KVS / NVS / other Central-government schools." },
]

export function categoryByCode(code: string): SchoolCategory | undefined {
  return SCHOOL_CATEGORIES.find((c) => c.code === code)
}

export function categoriesByManagement(m: Management): SchoolCategory[] {
  return SCHOOL_CATEGORIES.filter((c) => c.management === m)
}

export interface StructureSummary {
  stages: number
  totalGrades: number
  categories: number
  managements: number
}

export function structureSummary(): StructureSummary {
  const grades = new Set<number>()
  for (const s of SCHOOL_STAGES) for (const g of s.grades) grades.add(g)
  return {
    stages: SCHOOL_STAGES.length,
    totalGrades: grades.size,
    categories: SCHOOL_CATEGORIES.length,
    managements: new Set(SCHOOL_CATEGORIES.map((c) => c.management)).size,
  }
}
