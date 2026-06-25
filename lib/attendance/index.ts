// VASA-EOS(SE) — daily attendance (Sec 25 / school operations).
// Pure marking + summary over the SIS roster; the UI cycles each student's status
// and shows live totals. Present + late count as "attended" for the day's rate.

import { SIS_ROSTER, type SisStudent } from "@/lib/sis"

export type AttendanceStatus = "present" | "absent" | "late" | "leave"

export const ATTENDANCE_STATUSES: AttendanceStatus[] = ["present", "absent", "late", "leave"]

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  leave: "On leave",
}

// Click-to-cycle order.
export const NEXT_STATUS: Record<AttendanceStatus, AttendanceStatus> = {
  present: "absent",
  absent: "late",
  late: "leave",
  leave: "present",
}

export function defaultRecords(roster: SisStudent[] = SIS_ROSTER): Record<string, AttendanceStatus> {
  return Object.fromEntries(roster.map((s) => [s.apaarId, "present" as AttendanceStatus]))
}

export interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
  leave: number
  pct: number // (present + late) / total
}

export function summariseAttendance(
  records: Record<string, AttendanceStatus>,
  roster: SisStudent[] = SIS_ROSTER,
): AttendanceSummary {
  let present = 0
  let absent = 0
  let late = 0
  let leave = 0
  for (const s of roster) {
    switch (records[s.apaarId] ?? "present") {
      case "present":
        present++
        break
      case "absent":
        absent++
        break
      case "late":
        late++
        break
      case "leave":
        leave++
        break
    }
  }
  const total = roster.length
  const pct = total === 0 ? 0 : Math.round(((present + late) / total) * 100)
  return { total, present, absent, late, leave, pct }
}
