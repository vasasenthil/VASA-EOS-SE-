// VASA-EOS(SE) — Day-Plan resolver: the capstone that JOINS all four operations modules into one
// resolved school day for a class+section on a date.
//
//   Working-Time profile (bell schedule, working weekdays, term)  ─┐
//   Holiday Calendar (categorised holidays)                        ├─►  resolveSchoolDay → working? reason
//   Timetable (weekday × period → subject/teacher/room)            ├─►  per-period slot (time from bell schedule)
//   Lesson Plans (rich per-period, by date)                        ┘    └─►  attached lesson plan
//
// Pure and fully testable: takes the four datasets, returns the resolved DayPlan. The page-level
// action fetches each store and calls this.

import { resolveSchoolDay, type WorkTimeProfile, type PeriodKind } from "@/lib/worktime"
import type { Holiday } from "@/lib/holidays"
import type { TimetableEntry } from "@/lib/timetable-manager"
import type { LessonPlan } from "@/lib/lessonplans"

export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const

export function weekdayName(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? "" : WEEKDAY_NAMES[d.getUTCDay()]
}

export interface DayPlanPeriod {
  ordinal: number | null // period number (1-based among teaching periods); null for breaks/assembly
  label: string
  kind: PeriodKind
  startTime: string
  endTime: string
  entry: TimetableEntry | null // timetable slot (subject/teacher/room) for this weekday+period+class
  lesson: LessonPlan | null // lesson plan for this exact date+period+class+section
}

export interface DayPlan {
  date: string
  classLevel: string
  section: string
  weekday: string
  working: boolean
  reason: string
  holidayName?: string
  periods: DayPlanPeriod[]
  stats: { teaching: number; scheduled: number; planned: number }
}

export interface DayPlanInputs {
  profile: WorkTimeProfile | null
  holidays: Holiday[]
  timetable: TimetableEntry[]
  lessons: LessonPlan[]
  classLevel: string
  section: string
  date: string
}

/** Resolve the full day plan for one class+section on one date by joining all four modules. */
export function resolveDayPlan(inputs: DayPlanInputs): DayPlan {
  const { profile, holidays, timetable, lessons, classLevel, section, date } = inputs
  const weekday = weekdayName(date)
  const base: DayPlan = { date, classLevel, section, weekday, working: false, reason: "No working-time profile", periods: [], stats: { teaching: 0, scheduled: 0, planned: 0 } }
  if (!profile) return base

  const school = resolveSchoolDay(profile, holidays, date)
  if (!school.working) {
    return { ...base, working: false, reason: school.reason, holidayName: school.holidayName }
  }

  let teaching = 0
  let scheduled = 0
  let planned = 0
  const periods: DayPlanPeriod[] = profile.periods.map((bp) => {
    const isTeaching = bp.kind === "Period"
    const ordinal = isTeaching ? ++teaching : null
    let entry: TimetableEntry | null = null
    let lesson: LessonPlan | null = null
    if (ordinal !== null) {
      entry = timetable.find((e) => e.classLevel === classLevel && e.section === section && e.day === weekday && e.period === ordinal) ?? null
      if (entry) scheduled++
      lesson = lessons.find((l) => l.classLevel === classLevel && l.section === section && l.date === date && l.period === ordinal) ?? null
      if (lesson) planned++
    }
    return { ordinal, label: bp.label, kind: bp.kind, startTime: bp.startTime, endTime: bp.endTime, entry, lesson }
  })

  return { date, classLevel, section, weekday, working: true, reason: "Working day", periods, stats: { teaching, scheduled, planned } }
}
