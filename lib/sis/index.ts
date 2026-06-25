// VASA-EOS(SE) — deepened Student Information System (Sec 25 / Flagship lifecycle).
// APAAR-anchored student records with a 360° view: lifecycle stage, attendance,
// NIPUN status, scheme participation, CWSN/IEP, and predictive risk flags.

import type { Student } from "@/lib/domain"

export interface SisStudent extends Student {
  className: string
  attendancePct: number
  nipunStatus: "on-track" | "needs-support"
  schemes: string[]
  cwsn?: { category: number; label: string }
  riskFlags: string[]
}

export const SIS_ROSTER: SisStudent[] = [
  {
    apaarId: "APAAR-100200300401", name: "Aarthi M", gender: "female", category: "MBC", motherTongue: "Tamil",
    stateTenant: "TN", district: "Chennai", currentSchoolUdise: "33010100101", journeyStatus: "enrolled",
    className: "Class 9-A", attendancePct: 94, nipunStatus: "on-track",
    schemes: ["Pudhumai Penn", "Free Bus Pass", "CMBS"], riskFlags: [],
  },
  {
    apaarId: "APAAR-100200300402", name: "Bharath K", gender: "male", category: "SC", motherTongue: "Tamil",
    stateTenant: "TN", district: "Chennai", currentSchoolUdise: "33010100101", journeyStatus: "enrolled",
    className: "Class 9-A", attendancePct: 71, nipunStatus: "needs-support",
    schemes: ["Adi Dravidar Welfare", "CMBS"], riskFlags: ["Attendance decline", "Dropout risk"],
  },
  {
    apaarId: "APAAR-100200300403", name: "Charumathi R", gender: "female", category: "BC", motherTongue: "Tamil",
    stateTenant: "TN", district: "Coimbatore", currentSchoolUdise: "33020200202", journeyStatus: "enrolled",
    className: "Class 7-B", attendancePct: 88, nipunStatus: "on-track",
    schemes: ["Pudhumai Penn", "CMBS", "Free Cycle"],
    cwsn: { category: 13, label: "Specific Learning Disabilities" }, riskFlags: ["IEP review due"],
  },
  {
    apaarId: "APAAR-100200300404", name: "Dinesh S", gender: "male", category: "FC", motherTongue: "Tamil",
    stateTenant: "TN", district: "Nilgiris", currentSchoolUdise: "33030300303", journeyStatus: "enrolled",
    className: "Class 11-C", attendancePct: 96, nipunStatus: "on-track",
    schemes: ["Naan Mudhalvan", "Free Laptop"], riskFlags: [],
  },
  {
    apaarId: "APAAR-100200300405", name: "Eswari T", gender: "female", category: "ST", motherTongue: "Irula",
    stateTenant: "TN", district: "Nilgiris", currentSchoolUdise: "33030300303", journeyStatus: "enrolled",
    className: "Class 6-A", attendancePct: 79, nipunStatus: "needs-support",
    schemes: ["Tribal Welfare Hostel", "CMBS"], riskFlags: ["Foundational literacy gap"],
  },
  {
    apaarId: "APAAR-100200300406", name: "Faizal A", gender: "male", category: "Minority", motherTongue: "Urdu",
    stateTenant: "TN", district: "Chennai", currentSchoolUdise: "33010100101", journeyStatus: "transferred",
    className: "Class 10-B", attendancePct: 90, nipunStatus: "on-track",
    schemes: ["Minority Welfare", "CMBS"], riskFlags: [],
  },
]

export function getSisStudent(apaarId: string): SisStudent | undefined {
  return SIS_ROSTER.find((s) => s.apaarId === apaarId)
}

export interface SisSummary {
  total: number
  girls: number
  cwsn: number
  atRisk: number
  avgAttendance: number
}

export function summarise(roster: SisStudent[] = SIS_ROSTER): SisSummary {
  const girls = roster.filter((s) => s.gender === "female").length
  const cwsn = roster.filter((s) => s.cwsn).length
  const atRisk = roster.filter((s) => s.riskFlags.length > 0).length
  const avgAttendance = Math.round(roster.reduce((s, x) => s + x.attendancePct, 0) / Math.max(roster.length, 1))
  return { total: roster.length, girls, cwsn, atRisk, avgAttendance }
}
