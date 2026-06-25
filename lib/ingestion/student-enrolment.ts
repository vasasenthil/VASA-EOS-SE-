// VASA-EOS(SE) — student-enrolment (SIS) ingestion schema (the third adapter — the largest dataset).
//
// The same engine that loads schools and teachers loads the student roster — the biggest dataset of all
// (~1 crore). Keyed idempotently on the 12-digit APAAR id (one child, one lifelong record), with the school
// cross-referenced by UDISE code. SAMPLE_CSV mirrors typical SIS/UDISE student columns and includes one invalid
// row (bad APAAR) and one duplicate (grade promoted) so validation and idempotency are demonstrable. Swap
// SAMPLE_CSV for a real SIS export to load real students — the adapter is unchanged. Pure + client-safe.

import { type Schema, digits, oneOf, nonNegativeInt, toInt } from "@/lib/ingestion"

export interface StudentRecord {
  apaarId: string
  name: string
  udiseCode: string
  grade: number
  gender: string
  category: string
  cwsn?: string
  dob?: string
}

export const GENDERS = ["Male", "Female", "Other"] as const
export const SOCIAL_CATEGORIES = ["General", "SC", "ST", "OBC", "EWS"] as const

export const STUDENT_SCHEMA: Schema<StudentRecord> = {
  name: "SIS student enrolment",
  idField: "apaarId",
  fields: [
    { column: "APAAR ID", key: "apaarId", required: true, validate: digits(12) },
    { column: "Student Name", key: "name", required: true },
    { column: "UDISE Code", key: "udiseCode", required: true, validate: digits(11) },
    { column: "Grade", key: "grade", required: true, validate: nonNegativeInt, transform: toInt },
    { column: "Gender", key: "gender", required: true, validate: oneOf(GENDERS) },
    { column: "Social Category", key: "category", required: true, validate: oneOf(SOCIAL_CATEGORIES) },
    { column: "CWSN", key: "cwsn" },
    { column: "Date of Birth", key: "dob" },
  ],
}

// Mirrors typical SIS columns. One invalid row (bad APAAR) and one duplicate (promoted a grade).
export const SAMPLE_CSV = `APAAR ID,Student Name,UDISE Code,Grade,Gender,Social Category,CWSN,Date of Birth
100200300401,Arun Kumar,33010100101,9,Male,SC,No,2011-03-14
100200300402,Priya Devi,33010100101,9,Female,General,No,2011-07-22
100200300511,Karthik R,33060200305,5,Male,ST,Yes,2015-01-09
100200300612,Fathima Banu,33150400512,8,Female,OBC,No,2012-11-30
BADAPAAR99,Invalid Child,33010100101,7,Male,SC,No,2013-05-05
100200300401,Arun Kumar,33010100101,10,Male,SC,No,2011-03-14
`

/** Enrolment counts by social category in the loaded set. */
export function byCategory(records: StudentRecord[]): { category: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const r of records) counts.set(r.category, (counts.get(r.category) ?? 0) + 1)
  return [...counts.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count)
}

/** CWSN (children with special needs) count. */
export function cwsnCount(records: StudentRecord[]): number {
  return records.filter((r) => (r.cwsn ?? "").toLowerCase() === "yes").length
}
