// VASA-EOS(SE) — Adaptive Learning Pathways: Personalisation Engine wired with HITL.
//
// AI-native, not a syllabus tracker: a teacher captures a learner's mastery across curriculum
// objectives (with prerequisites); the Personalisation Engine (lib/ai/engines/personalisation,
// Engine 2 of 6) recommends the objectives the learner is READY to learn next — not yet mastered,
// every prerequisite met — ranked by the gap, explainably. The teacher reviews and APPROVES an
// adaptive pathway (AI suggests next steps; the human decides what to teach). The recommendation is
// derived on read (never stored) so it is always reproducible.

import { personalise, type PersonalisationResult } from "@/lib/ai/engines/personalisation"
import { SUBJECT_AREAS } from "@/lib/courses"
import { CLASS_LEVELS, SECTIONS } from "@/lib/students"

export { SUBJECT_AREAS, CLASS_LEVELS, SECTIONS }
export type { PersonalisationResult }

export const PATHWAY_STATUSES = ["AI Draft", "Approved", "Active", "Completed"] as const
export type PathwayStatus = (typeof PATHWAY_STATUSES)[number]

export interface PathwayObjective {
  id: string
  label: string
  /** Labels of prerequisite objectives (mapped to ids for the engine). */
  prereqs: string[]
  /** Learner mastery 0–100 (%). */
  mastery: number
}

export interface Pathway {
  id: string
  student: string
  apaarId: string
  classLevel: string
  section: string
  subject: string
  title: string
  objectives: PathwayObjective[]
  threshold: number // mastery % at/above which an objective counts as mastered
  planStatus: PathwayStatus
  approvedBy: string
  plan: string
  createdAt: string
  updatedAt: string
}

export interface PathwayInput {
  student: string
  apaarId: string
  classLevel: string
  section: string
  subject: string
  title: string
  objectives: PathwayObjective[]
  threshold: number
  planStatus: PathwayStatus
  approvedBy: string
  plan: string
}

export function emptyPathway(): PathwayInput {
  return {
    student: "", apaarId: "", classLevel: "", section: "A", subject: "Mathematics", title: "",
    objectives: [
      { id: "o1", label: "Linear equations", prereqs: [], mastery: 80 },
      { id: "o2", label: "Factorisation", prereqs: ["Linear equations"], mastery: 40 },
    ],
    threshold: 70, planStatus: "AI Draft", approvedBy: "", plan: "",
  }
}

/** Run the Personalisation Engine over the objectives — genuinely calls Engine 2, not a re-impl. */
export function recommend(objectives: PathwayObjective[], thresholdPct: number): PersonalisationResult {
  const labelToId = new Map(objectives.map((o) => [o.label.trim().toLowerCase(), o.id]))
  const syllabus = objectives.map((o) => ({
    id: o.id,
    label: o.label,
    prereqs: o.prereqs.map((p) => labelToId.get(p.trim().toLowerCase())).filter((x): x is string => !!x),
  }))
  const mastery: Record<string, number> = {}
  for (const o of objectives) mastery[o.id] = Math.max(0, Math.min(1, (o.mastery || 0) / 100))
  return personalise({ mastery, syllabus, threshold: Math.max(0, Math.min(1, (thresholdPct || 70) / 100)) })
}

/** A starter pathway the teacher reviews/edits before approving (AI suggests, human decides). */
export function suggestPlan(result: PersonalisationResult): string {
  if (result.recommendations.length === 0) return "No ready next step — reinforce prerequisites first, then re-assess."
  const steps = result.recommendations.slice(0, 3).map((r, i) => `${i + 1}. ${r.label}`).join("  ")
  return `Recommended next learning sequence: ${steps}. Pair with worked examples and graded practice; advance as mastery reaches the threshold.`
}

export type PathwayErrors = Partial<Record<keyof PathwayInput, string>>

export function validatePathway(f: PathwayInput): { ok: boolean; errors: PathwayErrors } {
  const e: PathwayErrors = {}
  if (!f.student.trim()) e.student = "Student is required"
  if (!(CLASS_LEVELS as readonly string[]).includes(f.classLevel)) e.classLevel = "Select the class"
  if (!(SECTIONS as readonly string[]).includes(f.section)) e.section = "Select the section"
  if (!(SUBJECT_AREAS as readonly string[]).includes(f.subject)) e.subject = "Select the subject"
  if (!f.title.trim()) e.title = "Title is required"
  if (!Number.isFinite(f.threshold) || f.threshold < 1 || f.threshold > 100) e.threshold = "Threshold must be 1–100"
  if (!(PATHWAY_STATUSES as readonly string[]).includes(f.planStatus)) e.planStatus = "Select a status"
  if (f.planStatus !== "AI Draft" && !f.approvedBy.trim()) e.approvedBy = "Approver is required once the pathway leaves AI Draft"
  if (!Array.isArray(f.objectives) || f.objectives.length === 0) e.objectives = "Add at least one objective"
  else if (f.objectives.some((o) => !o.label.trim() || !Number.isFinite(o.mastery) || o.mastery < 0 || o.mastery > 100)) e.objectives = "Each objective needs a label and mastery 0–100"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface PathwayFilters {
  query?: string
  subject?: string
  classLevel?: string
  planStatus?: string
  sortBy?: "title" | "student"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface PathwaySummary {
  total: number
  withReadyStep: number
  active: number
  completed: number
}

export interface PathwayPage {
  pathways: Pathway[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  summary: PathwaySummary
}

const DEFAULT_PAGE_SIZE = 9

export function pathwaySummary(all: Pathway[]): PathwaySummary {
  let withReadyStep = 0, active = 0, completed = 0
  for (const p of all) {
    if (recommend(p.objectives, p.threshold).recommendations.length > 0) withReadyStep++
    if (p.planStatus === "Active" || p.planStatus === "Approved") active++
    if (p.planStatus === "Completed") completed++
  }
  return { total: all.length, withReadyStep, active, completed }
}

export function queryPathways(all: Pathway[], f: PathwayFilters = {}): PathwayPage {
  const q = (f.query ?? "").trim().toLowerCase()
  let rows = all.filter((p) => {
    if (q && !(`${p.student} ${p.title} ${p.subject}`.toLowerCase().includes(q))) return false
    if (f.subject && p.subject !== f.subject) return false
    if (f.classLevel && p.classLevel !== f.classLevel) return false
    if (f.planStatus && p.planStatus !== f.planStatus) return false
    return true
  })
  const summary = pathwaySummary(rows)
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "title"
  rows = [...rows].sort((a, b) => {
    const av = by === "student" ? a.student : a.title
    const bv = by === "student" ? b.student : b.title
    return av < bv ? -dir : av > bv ? dir : 0
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { pathways: rows.slice(start, start + pageSize), total, totalPages, page, pageSize, summary }
}
