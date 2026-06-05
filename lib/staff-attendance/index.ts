// VASA-EOS(SE) — staff attendance (Sec 16 / HR ops).
// Mark teaching/non-teaching staff present/absent/late/on-duty. Present, late and
// on-duty all count as "attended". Pure cycle + summary helpers.

export type StaffStatus = "present" | "absent" | "late" | "on_duty"

export const STAFF_STATUS_LABELS: Record<StaffStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  on_duty: "On duty",
}

export const NEXT_STAFF_STATUS: Record<StaffStatus, StaffStatus> = {
  present: "absent",
  absent: "late",
  late: "on_duty",
  on_duty: "present",
}

export function defaultStaffRecords(staff: string[]): Record<string, StaffStatus> {
  return Object.fromEntries(staff.map((s) => [s, "present" as StaffStatus]))
}

export interface StaffSummary {
  total: number
  present: number
  absent: number
  late: number
  onDuty: number
  pct: number // (present + late + on_duty) / total
}

export function summariseStaff(records: Record<string, StaffStatus>, staff: string[]): StaffSummary {
  let present = 0
  let absent = 0
  let late = 0
  let onDuty = 0
  for (const s of staff) {
    switch (records[s] ?? "present") {
      case "present":
        present++
        break
      case "absent":
        absent++
        break
      case "late":
        late++
        break
      case "on_duty":
        onDuty++
        break
    }
  }
  const total = staff.length
  const pct = total === 0 ? 0 : Math.round(((present + late + onDuty) / total) * 100)
  return { total, present, absent, late, onDuty, pct }
}
