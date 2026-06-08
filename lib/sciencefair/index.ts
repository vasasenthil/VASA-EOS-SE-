// VASA-EOS(SE) — science exhibition / INSPIRE Awards register (co-scholastic, STEM).
// Register projects, judge them and auto-shortlist top scorers. Pure logic.

export const SF_CATEGORIES = [
  "Physics",
  "Chemistry",
  "Biology",
  "Mathematics",
  "Environment",
  "Working model",
  "Robotics / IoT",
]

export const SF_SHORTLIST_CUTOFF = 70

export interface SfProject {
  id: string
  title: string
  student: string
  cls: string
  category: string
  score: number
  judged: boolean
  /** Tenant node this project belongs to — drives per-role data scoping. */
  tenantId: string
}

export interface SfSummary {
  total: number
  judged: number
  shortlisted: number
  avgScore: number
}

export function isShortlisted(p: SfProject): boolean {
  return p.judged && p.score >= SF_SHORTLIST_CUTOFF
}

export function sfSummary(projects: SfProject[]): SfSummary {
  const judged = projects.filter((p) => p.judged)
  const avg = judged.length === 0 ? 0 : Math.round(judged.reduce((sum, p) => sum + p.score, 0) / judged.length)
  return {
    total: projects.length,
    judged: judged.length,
    shortlisted: projects.filter(isShortlisted).length,
    avgScore: avg,
  }
}
