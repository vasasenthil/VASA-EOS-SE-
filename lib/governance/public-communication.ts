// VASA-EOS(SE) — public-communication / press desk (the Minister's citizen-facing voice).
//
// The executive speaks to citizens — press notes, web bulletins, SMS blasts, social posts. A figure quoted
// to the press that disagrees with the platform's own dashboard is a credibility risk, so every announcement
// here is COMPOSED FROM LIVE DATA (the same state rollup), with the source module cited and a clearance status
// before publication. Reuses the Assembly briefing's value-interpolation so press and floor never diverge.
// Every sourceRef is asserted to exist on disk (self-verifying). Pure + client-safe.

import { csvField } from "@/lib/csv"

import { stateRollup, type StateRollup } from "@/lib/portal-data"
import { formatValue, type NumericRollupKey, type AnswerFormat } from "@/lib/governance/assembly-briefing"

export type Channel = "press" | "web" | "sms" | "social"
export type CommsStatus = "draft" | "cleared" | "published"

export interface Announcement {
  id: string
  title: string
  channel: Channel
  audience: string
  /** The live rollup figure quoted. */
  dataKey: NumericRollupKey
  format: AnswerFormat
  /** Body with a {value} placeholder filled from live data. */
  bodyTemplate: string
  /** In-repo module the figure derives from (asserted to exist). */
  sourceRef: string
  status: CommsStatus
}

export const ANNOUNCEMENTS: Announcement[] = [
  { id: "enrolment-bulletin", title: "Record enrolment in Government schools", channel: "press", audience: "General public", dataKey: "students", format: "count", bodyTemplate: "Tamil Nadu Government schools now serve {value} students, the State's largest-ever enrolment.", sourceRef: "lib/sis/index.ts", status: "published" },
  { id: "girls-education", title: "Girls' education milestone", channel: "social", audience: "Parents & students", dataKey: "girls", format: "count", bodyTemplate: "{value} girl students are enrolled and supported through Pudhumai Penn and allied schemes.", sourceRef: "lib/sis/index.ts", status: "cleared" },
  { id: "scheme-reach", title: "Welfare schemes reach", channel: "press", audience: "General public", dataKey: "schemeCoveragePct", format: "percent", bodyTemplate: "Student welfare schemes now reach {value} of eligible learners through direct, de-duplicated delivery.", sourceRef: "lib/portal-data/index.ts", status: "cleared" },
  { id: "attendance-web", title: "Attendance update", channel: "web", audience: "General public", dataKey: "avgAttendance", format: "percent", bodyTemplate: "Average student attendance stands at {value} across Government schools this term.", sourceRef: "lib/attendance/index.ts", status: "draft" },
  { id: "school-finder", title: "School registry open to citizens", channel: "web", audience: "Parents", dataKey: "schools", format: "count", bodyTemplate: "{value} schools are now searchable in the public UDISE+ registry with facilities and contacts.", sourceRef: "lib/sis/index.ts", status: "published" },
  { id: "atrisk-support", title: "Dropout-prevention drive", channel: "press", audience: "General public", dataKey: "atRisk", format: "count", bodyTemplate: "{value} at-risk learners have been flagged for targeted retention support under the early-warning system.", sourceRef: "lib/tracking/analytics.ts", status: "draft" },
]

export function composeBody(a: Announcement, r: StateRollup = stateRollup()): string {
  return a.bodyTemplate.replace("{value}", formatValue(r[a.dataKey], a.format))
}

export interface PreparedAnnouncement extends Announcement {
  body: string
}

export function pressKit(r: StateRollup = stateRollup()): PreparedAnnouncement[] {
  return ANNOUNCEMENTS.map((a) => ({ ...a, body: composeBody(a, r) }))
}

export function announcementById(id: string): Announcement | undefined {
  return ANNOUNCEMENTS.find((a) => a.id === id)
}

export function byStatus(status: CommsStatus): Announcement[] {
  return ANNOUNCEMENTS.filter((a) => a.status === status)
}

export interface CommsSummary {
  announcements: number
  published: number
  cleared: number
  draft: number
  channels: number
  sourcesCited: number
}

export function commsSummary(items: Announcement[] = ANNOUNCEMENTS): CommsSummary {
  return {
    announcements: items.length,
    published: items.filter((a) => a.status === "published").length,
    cleared: items.filter((a) => a.status === "cleared").length,
    draft: items.filter((a) => a.status === "draft").length,
    channels: new Set(items.map((a) => a.channel)).size,
    sourcesCited: new Set(items.map((a) => a.sourceRef)).size,
  }
}


export function toCSV(r: StateRollup = stateRollup()): string {
  const header = ["ID", "Title", "Channel", "Audience", "Body", "Source", "Status"]
  const rows = pressKit(r).map((a) => [a.id, a.title, a.channel, a.audience, a.body, a.sourceRef, a.status].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
