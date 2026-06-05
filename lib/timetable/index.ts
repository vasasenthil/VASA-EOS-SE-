// VASA-EOS(SE) — timetable & substitution (Sec 25 / school operations).
// Pure grid model + substitution logic: when a teacher is absent, find their periods
// and suggest teachers who are free in those slots. The UI edits the grid and runs
// substitution live so schools can enter their own timetable.

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const
export type Day = (typeof DAYS)[number]

export const PERIODS = [1, 2, 3, 4, 5, 6] as const

export interface Slot {
  subject: string
  teacher: string
}

export type Grid = Record<string, Slot> // key = `${day}-${period}`

export function slotKey(day: Day, period: number): string {
  return `${day}-${period}`
}

export const TEACHERS = ["Mrs. Lakshmi", "Mr. Raja", "Ms. Fatima", "Mr. Suresh", "Mrs. Priya"]

// A small seeded timetable so the grid isn't empty on first view.
export const SAMPLE_GRID: Grid = {
  "Mon-1": { subject: "Tamil", teacher: "Mrs. Lakshmi" },
  "Mon-2": { subject: "Maths", teacher: "Mr. Raja" },
  "Mon-3": { subject: "Science", teacher: "Ms. Fatima" },
  "Tue-1": { subject: "English", teacher: "Mr. Suresh" },
  "Tue-2": { subject: "Maths", teacher: "Mr. Raja" },
  "Wed-1": { subject: "Social", teacher: "Mrs. Priya" },
  "Wed-3": { subject: "Science", teacher: "Ms. Fatima" },
  "Thu-2": { subject: "Tamil", teacher: "Mrs. Lakshmi" },
  "Fri-1": { subject: "Maths", teacher: "Mr. Raja" },
}

/** All slots (with day/period) a teacher is assigned to. */
export function teacherSlots(grid: Grid, teacher: string): { day: Day; period: number; subject: string }[] {
  const out: { day: Day; period: number; subject: string }[] = []
  for (const day of DAYS) {
    for (const period of PERIODS) {
      const s = grid[slotKey(day, period)]
      if (s && s.teacher === teacher) out.push({ day, period, subject: s.subject })
    }
  }
  return out
}

/** Teachers with no assignment in a given day/period. */
export function freeTeachers(grid: Grid, day: Day, period: number, teachers: string[] = TEACHERS): string[] {
  const busy = new Set<string>()
  for (const t of teachers) {
    const s = grid[slotKey(day, period)]
    if (s && s.teacher === t) busy.add(t)
  }
  return teachers.filter((t) => !busy.has(t))
}

export interface Substitution {
  day: Day
  period: number
  subject: string
  candidates: string[]
}

/** For an absent teacher, list each of their periods with free substitute candidates. */
export function suggestSubstitutes(grid: Grid, absent: string, teachers: string[] = TEACHERS): Substitution[] {
  return teacherSlots(grid, absent).map(({ day, period, subject }) => ({
    day,
    period,
    subject,
    candidates: freeTeachers(grid, day, period, teachers).filter((t) => t !== absent),
  }))
}

/** Count of filled slots. */
export function periodsFilled(grid: Grid): number {
  return Object.keys(grid).length
}
