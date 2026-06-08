// VASA-EOS(SE) — ICT lab / smart-class usage log (digital learning utilisation).
// Log lab sessions and track device uptime and per-session shortages. Pure logic.

export const ICT_SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Tamil",
  "Social Science",
  "Computer Science",
  "Coding / robotics",
]

export interface IctSession {
  id: string
  cls: string
  subject: string
  date: string
  students: number
  devicesWorking: number
  devicesTotal: number
  /** Tenant node this session belongs to — drives per-role data scoping. */
  tenantId: string
}

// A session has a shortage when working devices can't cover the class.
export function hasShortage(s: IctSession): boolean {
  return s.devicesWorking < s.students
}

export interface IctSummary {
  sessions: number
  studentsReached: number
  uptimePct: number
  shortageSessions: number
}

export function ictSummary(sessions: IctSession[]): IctSummary {
  const totalDevices = sessions.reduce((sum, s) => sum + s.devicesTotal, 0)
  const working = sessions.reduce((sum, s) => sum + Math.min(s.devicesWorking, s.devicesTotal), 0)
  return {
    sessions: sessions.length,
    studentsReached: sessions.reduce((sum, s) => sum + s.students, 0),
    uptimePct: totalDevices === 0 ? 0 : Math.round((working / totalDevices) * 100),
    shortageSessions: sessions.filter(hasShortage).length,
  }
}
