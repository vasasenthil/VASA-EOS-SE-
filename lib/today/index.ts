// VASA-EOS(SE) — the flagship "wedge": a teacher's daily 60-second loop.
// Turns the SIS roster into today's prioritised actions (attendance, at-risk
// follow-ups, practice nudges, IEP reviews) so a teacher opens one screen, clears
// it in under a minute, and builds a streak. Pure + testable; the UI just checks off.

import { SIS_ROSTER, type SisStudent } from "@/lib/sis"

export type TaskKind = "attendance" | "iep_review" | "follow_up" | "nudge"

export interface DailyTask {
  id: string
  kind: TaskKind
  title: string
  detail?: string
  student?: string
  priority: number // higher = more urgent (sort desc)
}

export const TASK_LABELS: Record<TaskKind, string> = {
  attendance: "Attendance",
  iep_review: "IEP review",
  follow_up: "Follow-up",
  nudge: "Practice nudge",
}

/** Build today's prioritised task list for a teacher from the roster. */
export function buildDailyTasks(roster: SisStudent[] = SIS_ROSTER): DailyTask[] {
  const tasks: DailyTask[] = [
    { id: "attendance", kind: "attendance", title: "Mark today's attendance", priority: 100 },
  ]

  for (const s of roster) {
    if (s.cwsn && s.riskFlags.some((f) => /iep/i.test(f))) {
      tasks.push({
        id: `iep:${s.apaarId}`,
        kind: "iep_review",
        title: `IEP review due — ${s.name}`,
        detail: s.cwsn.label,
        student: s.name,
        priority: 90,
      })
    }
    if (s.riskFlags.some((f) => !/iep/i.test(f))) {
      const flag = s.riskFlags.find((f) => !/iep/i.test(f))
      tasks.push({
        id: `follow:${s.apaarId}`,
        kind: "follow_up",
        title: `Follow up — ${s.name}`,
        detail: flag,
        student: s.name,
        priority: 80,
      })
    }
    if (s.nipunStatus === "needs-support") {
      tasks.push({
        id: `nudge:${s.apaarId}`,
        kind: "nudge",
        title: `Send a practice nudge — ${s.name}`,
        detail: "NIPUN: needs support",
        student: s.name,
        priority: 60,
      })
    }
  }

  return tasks.sort((a, b) => b.priority - a.priority)
}

export interface DayProgress {
  total: number
  done: number
  pct: number
  complete: boolean
}

/** Progress given how many of `total` tasks are done. */
export function dayProgress(total: number, done: number): DayProgress {
  const safeTotal = Math.max(total, 0)
  const safeDone = Math.min(Math.max(done, 0), safeTotal)
  const pct = safeTotal === 0 ? 100 : Math.round((safeDone / safeTotal) * 100)
  return { total: safeTotal, done: safeDone, pct, complete: safeDone >= safeTotal && safeTotal > 0 }
}

/** Consecutive completed days counting back from the most recent. */
export function streak(history: boolean[]): number {
  let n = 0
  for (let i = history.length - 1; i >= 0; i--) {
    if (!history[i]) break
    n++
  }
  return n
}
