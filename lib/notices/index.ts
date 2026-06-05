// VASA-EOS(SE) — notice board / circulars (Sec 48 / communication).
// Publish notices to an audience; pin important ones. Pure sort + summary.

export type NoticeCategory = "General" | "Examination" | "Holiday" | "Event" | "Urgent"
export type NoticeAudience = "All" | "Students" | "Parents" | "Staff"

export const NOTICE_CATEGORIES: NoticeCategory[] = ["General", "Examination", "Holiday", "Event", "Urgent"]
export const NOTICE_AUDIENCES: NoticeAudience[] = ["All", "Students", "Parents", "Staff"]

export interface Notice {
  id: string
  title: string
  body: string
  category: NoticeCategory
  audience: NoticeAudience
  date: string
  pinned: boolean
}

export function newNoticeId(): string {
  return `nt-${Math.random().toString(36).slice(2, 8)}`
}

export const SAMPLE_NOTICES: Notice[] = [
  { id: "nt-seed1", title: "Half-yearly exam timetable released", body: "Exams begin 14 Sep. See the academic calendar.", category: "Examination", audience: "All", date: "2026-09-01", pinned: true },
  { id: "nt-seed2", title: "School closed for Pongal", body: "School remains closed 14-16 Jan for Pongal.", category: "Holiday", audience: "All", date: "2027-01-10", pinned: false },
]

/** Pinned first, then most recent date first. */
export function sortNotices(notices: Notice[]): Notice[] {
  return [...notices].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return a.date < b.date ? 1 : a.date > b.date ? -1 : 0
  })
}

export interface NoticeSummary {
  total: number
  pinned: number
  urgent: number
}

export function noticeSummary(notices: Notice[]): NoticeSummary {
  return {
    total: notices.length,
    pinned: notices.filter((n) => n.pinned).length,
    urgent: notices.filter((n) => n.category === "Urgent").length,
  }
}
