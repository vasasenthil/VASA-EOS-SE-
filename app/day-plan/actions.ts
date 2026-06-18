"use server"

import { unstable_noStore as noStore } from "next/cache"
import { resolveDayPlan, type DayPlan } from "@/lib/dayplan"
import { getActiveWorkTime } from "@/lib/worktime/store"
import { listHolidays } from "@/lib/holidays/store"
import { listTimetable } from "@/lib/timetable-manager/store"
import { listLessonPlans } from "@/lib/lessonplans/store"
import { logger } from "@/lib/logger"

/**
 * Resolve the full day plan for a class+section on a date by JOINING all four operations modules —
 * Working-Time profile, Holiday Calendar, Timetable and Lesson Plans. Read-only; fails soft to a
 * non-working result so the page never crashes.
 */
export async function resolveDayPlanAction(classLevel: string, section: string, date: string): Promise<DayPlan> {
  noStore()
  try {
    const [profile, holidays, timetable, lessons] = await Promise.all([
      getActiveWorkTime(),
      listHolidays(),
      listTimetable(),
      listLessonPlans(),
    ])
    return resolveDayPlan({ profile: profile ?? null, holidays, timetable, lessons, classLevel, section, date })
  } catch (e) {
    logger.error("dayplan.resolve failed", { error: String(e) })
    return { date, classLevel, section, weekday: "", working: false, reason: "Could not resolve the day plan.", periods: [], stats: { teaching: 0, scheduled: 0, planned: 0 } }
  }
}
