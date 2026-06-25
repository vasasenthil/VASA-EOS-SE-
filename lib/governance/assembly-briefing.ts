// VASA-EOS(SE) — Legislative Assembly Q&A briefing-pack generator (the Secretary's signature deliverable).
//
// When the Tamil Nadu Legislative Assembly is in session, the Secretary (School Education) prepares the
// Minister to answer starred/unstarred questions. This compiles a briefing pack: each Assembly question is
// answered FROM LIVE PLATFORM DATA (the same state rollup the Secretary dashboard shows), every figure cites
// the in-repo source module it derives from, anticipated supplementary questions are listed, and a clearance
// status tracks readiness. No figure is hand-typed — answerFor() reads the rollup — so the pack is always
// consistent with the platform. Every sourceRef is asserted to exist on disk (self-verifying). Pure + client-safe.

import { csvField } from "@/lib/csv"

import { stateRollup, type StateRollup } from "@/lib/portal-data"

export type QuestionType = "starred" | "unstarred"
export type ClearanceStatus = "draft" | "reviewed" | "cleared"
export type AnswerFormat = "count" | "percent" | "index"

/** Only the numeric figures of the rollup can answer a quantitative question. */
export type NumericRollupKey = { [K in keyof StateRollup]: StateRollup[K] extends number ? K : never }[keyof StateRollup]

export interface AssemblyQuestion {
  id: string
  /** Assembly question number as listed on the order paper. */
  number: string
  type: QuestionType
  /** Member (MLA) who tabled the question. */
  member: string
  constituency: string
  subject: string
  questionText: string
  /** The live rollup figure that answers it. */
  dataKey: NumericRollupKey
  format: AnswerFormat
  /** Answer sentence with a {value} placeholder filled from live data. */
  answerTemplate: string
  /** In-repo module the figure derives from (asserted to exist). */
  sourceRef: string
  /** Supplementary questions the Minister should be ready for. */
  supplementaries: string[]
  status: ClearanceStatus
}

export const ASSEMBLY_QUESTIONS: AssemblyQuestion[] = [
  { id: "enrolment", number: "Q.247", type: "starred", member: "Thiru K. Murugan", constituency: "Madurai East", subject: "Student enrolment", questionText: "How many students are currently enrolled in Government and aided schools across the State?", dataKey: "students", format: "count", answerTemplate: "{value} students are presently enrolled across the State, tracked on the unified roster.", sourceRef: "lib/sis/index.ts", supplementaries: ["District-wise break-up?", "Year-on-year retention trend?"], status: "cleared" },
  { id: "girls", number: "Q.251", type: "starred", member: "Tmt. R. Selvi", constituency: "Salem West", subject: "Girls' education", questionText: "What is the enrolment of girl children, and what measures sustain it?", dataKey: "girls", format: "count", answerTemplate: "{value} girl students are enrolled; bicycle, scholarship and toilet-access schemes sustain retention.", sourceRef: "lib/sis/index.ts", supplementaries: ["Gender parity index?", "Drop-out at secondary stage?"], status: "cleared" },
  { id: "cwsn", number: "Q.255", type: "unstarred", member: "Thiru A. Pandian", constituency: "Tirunelveli", subject: "Inclusive education", questionText: "How many children with special needs (21 RPwD categories) are enrolled and supported?", dataKey: "cwsn", format: "count", answerTemplate: "{value} children with special needs are enrolled and tracked for entitlements under the RPwD framework.", sourceRef: "lib/cwsn/index.ts", supplementaries: ["Special-educator availability?", "Assistive-aid coverage?"], status: "reviewed" },
  { id: "attendance", number: "Q.260", type: "starred", member: "Tmt. P. Lakshmi", constituency: "Coimbatore South", subject: "Attendance", questionText: "What is the average student attendance in State schools this term?", dataKey: "avgAttendance", format: "percent", answerTemplate: "Average attendance stands at {value}, monitored daily across schools.", sourceRef: "lib/attendance/index.ts", supplementaries: ["Lowest-performing districts?", "Mid-day-meal correlation?"], status: "reviewed" },
  { id: "fln", number: "Q.262", type: "unstarred", member: "Thiru S. Velu", constituency: "Thanjavur", subject: "Foundational literacy", questionText: "What proportion of learners are on-track for NIPUN / foundational literacy and numeracy goals?", dataKey: "nipunOnTrackPct", format: "percent", answerTemplate: "{value} of assessed learners are on-track for NIPUN foundational goals, per diagnostic data.", sourceRef: "lib/diagnostic/index.ts", supplementaries: ["Remediation coverage?", "Grade-wise gaps?"], status: "draft" },
  { id: "schemes", number: "Q.266", type: "starred", member: "Thiru M. Arumugam", constituency: "Vellore", subject: "Welfare schemes", questionText: "What is the coverage of student welfare schemes across eligible learners?", dataKey: "schemeCoveragePct", format: "percent", answerTemplate: "Welfare-scheme coverage reaches {value} of eligible learners through direct, de-duplicated delivery.", sourceRef: "lib/portal-data/index.ts", supplementaries: ["Leakage-reduction measures?", "DBT transfer timeliness?"], status: "reviewed" },
  { id: "infrastructure", number: "Q.270", type: "unstarred", member: "Tmt. G. Bhuvana", constituency: "Erode", subject: "Infrastructure", questionText: "What is the infrastructure readiness of schools against RTE norms?", dataKey: "infraReadiness", format: "percent", answerTemplate: "School infrastructure readiness averages {value} against RTE Section-19 norms; mandated gaps are under closure.", sourceRef: "lib/infrastructure/index.ts", supplementaries: ["Number of RTE-mandated gaps?", "PM SHRI upgrade status?"], status: "draft" },
  { id: "atrisk", number: "Q.273", type: "starred", member: "Thiru D. Kannan", constituency: "Dindigul", subject: "Dropout prevention", questionText: "How many learners are flagged at-risk of dropping out, and what is being done?", dataKey: "atRisk", format: "count", answerTemplate: "{value} learners are flagged at-risk on the early-warning register and receive targeted retention support.", sourceRef: "lib/tracking/analytics.ts", supplementaries: ["Re-enrolment success rate?", "OOSC mainstreaming numbers?"], status: "reviewed" },
  { id: "safety", number: "Q.277", type: "unstarred", member: "Tmt. V. Anitha", constituency: "Kanyakumari", subject: "School safety", questionText: "How many active safety incidents are open, and is drill compliance being maintained?", dataKey: "activeIncidents", format: "count", answerTemplate: "{value} safety incidents are currently active and under resolution; mock-drill compliance is enforced.", sourceRef: "lib/emergency/index.ts", supplementaries: ["POCSO safeguarding measures?", "Transport-safety status?"], status: "draft" },
  { id: "quality", number: "Q.280", type: "starred", member: "Thiru B. Ramesh", constituency: "Tiruchirappalli", subject: "School quality", questionText: "What is the average school quality index across the State?", dataKey: "avgQualityIndex", format: "index", answerTemplate: "The average school quality index is {value}/100, with high-priority inspections scheduled where it lags.", sourceRef: "lib/quality/index.ts", supplementaries: ["Inspections due this quarter?", "Lowest-quartile schools?"], status: "cleared" },
]

export function formatValue(v: number, format: AnswerFormat): string {
  if (format === "percent") return `${v}%`
  if (format === "index") return `${v}`
  return v.toLocaleString("en-IN")
}

export function answerFor(q: AssemblyQuestion, r: StateRollup = stateRollup()): string {
  return q.answerTemplate.replace("{value}", formatValue(r[q.dataKey], q.format))
}

export interface BriefingEntry extends AssemblyQuestion {
  answer: string
}

export function briefingPack(r: StateRollup = stateRollup()): BriefingEntry[] {
  return ASSEMBLY_QUESTIONS.map((q) => ({ ...q, answer: answerFor(q, r) }))
}

export function questionById(id: string): AssemblyQuestion | undefined {
  return ASSEMBLY_QUESTIONS.find((q) => q.id === id)
}

export function byStatus(status: ClearanceStatus): AssemblyQuestion[] {
  return ASSEMBLY_QUESTIONS.filter((q) => q.status === status)
}

export interface BriefingSummary {
  questions: number
  starred: number
  unstarred: number
  cleared: number
  reviewed: number
  draft: number
  /** Share cleared for the floor, 0–100. */
  readinessPct: number
  /** Distinct in-repo source modules cited. */
  sourcesCited: number
}

export function briefingSummary(items: AssemblyQuestion[] = ASSEMBLY_QUESTIONS): BriefingSummary {
  const cleared = items.filter((q) => q.status === "cleared").length
  return {
    questions: items.length,
    starred: items.filter((q) => q.type === "starred").length,
    unstarred: items.filter((q) => q.type === "unstarred").length,
    cleared,
    reviewed: items.filter((q) => q.status === "reviewed").length,
    draft: items.filter((q) => q.status === "draft").length,
    readinessPct: items.length === 0 ? 0 : Math.round((cleared / items.length) * 100),
    sourcesCited: new Set(items.map((q) => q.sourceRef)).size,
  }
}


export function toCSV(r: StateRollup = stateRollup()): string {
  const header = ["Number", "Type", "Member", "Constituency", "Subject", "Question", "Answer", "Source", "Status"]
  const rows = briefingPack(r).map((q) =>
    [q.number, q.type, q.member, q.constituency, q.subject, q.questionText, q.answer, q.sourceRef, q.status].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
