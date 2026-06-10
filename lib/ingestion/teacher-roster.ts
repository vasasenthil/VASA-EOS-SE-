// VASA-EOS(SE) — teacher-roster ingestion schema (the second adapter — proving the template rolls).
//
// The same engine that loads UDISE+ schools loads an EMIS teacher roster: only the schema changes. Keyed
// idempotently on the Teacher ID, with the school cross-referenced by its UDISE code so a roster joins the
// school registry. SAMPLE_CSV mirrors typical EMIS columns and includes one invalid row (bad UDISE) and one
// duplicate (same Teacher ID, updated designation) so validation and idempotency are demonstrable. Swap
// SAMPLE_CSV for a real EMIS export to load real teachers — the adapter is unchanged. Pure + client-safe.

import { type Schema, digits, oneOf } from "@/lib/ingestion"

export interface TeacherRecord {
  teacherId: string
  name: string
  udiseCode: string
  district: string
  subject: string
  designation: string
  qualification?: string
  dateOfJoining?: string
}

export const DESIGNATIONS = [
  "Secondary Grade Teacher",
  "BT Assistant",
  "PG Assistant",
  "Headmaster",
  "Physical Education Teacher",
  "Special Educator",
] as const

export const TEACHER_SCHEMA: Schema<TeacherRecord> = {
  name: "EMIS teacher roster",
  idField: "teacherId",
  fields: [
    { column: "Teacher ID", key: "teacherId", required: true, validate: (r) => (/^[A-Za-z0-9]{6,}$/.test(r) ? null : "must be ≥6 alphanumeric chars") },
    { column: "Teacher Name", key: "name", required: true },
    { column: "UDISE Code", key: "udiseCode", required: true, validate: digits(11) },
    { column: "District", key: "district", required: true },
    { column: "Subject", key: "subject", required: true },
    { column: "Designation", key: "designation", required: true, validate: oneOf(DESIGNATIONS) },
    { column: "Qualification", key: "qualification" },
    { column: "Date of Joining", key: "dateOfJoining" },
  ],
}

// Mirrors typical EMIS columns. One invalid row (bad UDISE) and one duplicate (TR33010045).
export const SAMPLE_CSV = `Teacher ID,Teacher Name,UDISE Code,District,Subject,Designation,Qualification,Date of Joining
TR33010045,Lakshmi Narayanan,33010100101,Chennai,Mathematics,PG Assistant,M.Sc B.Ed,2014-06-02
TR33010046,Anitha Rajan,33010100101,Chennai,Tamil,BT Assistant,M.A B.Ed,2016-07-11
TR33060312,Murugesan K,33060200305,Madurai,Primary,Secondary Grade Teacher,D.El.Ed,2012-06-15
TR33150088,Joseph Antony,33150400512,Coimbatore,Physical Education,Physical Education Teacher,M.P.Ed,2018-08-01
TRBADcode01,Bad Row,ABC,Salem,Science,BT Assistant,B.Sc B.Ed,2019-06-10
TR33010045,Lakshmi Narayanan,33010100101,Chennai,Mathematics,Headmaster,M.Sc B.Ed M.Phil,2014-06-02
`

/** Count teachers per UDISE school in the loaded set. */
export function teachersPerSchool(records: TeacherRecord[]): { udiseCode: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const r of records) counts.set(r.udiseCode, (counts.get(r.udiseCode) ?? 0) + 1)
  return [...counts.entries()].map(([udiseCode, count]) => ({ udiseCode, count })).sort((a, b) => b.count - a.count)
}
