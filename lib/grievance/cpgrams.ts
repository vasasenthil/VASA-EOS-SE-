// VASA-EOS(SE) — CPGRAMS federation (National tier — Module Catalogue v3.0).
//
// Grievances that escalate past the State land on CPGRAMS, the national Centralised Public Grievance Redress
// and Monitoring System, which carries its own statutory clock (the revised 21-day disposal norm) and its own
// status vocabulary. This federates a platform grievance to CPGRAMS: it maps the local status to the CPGRAMS
// lifecycle, assigns a registration number and ministry/subject, and tracks days-pending against the 21-day
// SLA so breaches surface. Time-pure (every function takes an explicit `now`). Builds on the grievance core;
// client-safe.

import { type GrievanceStatus } from "@/lib/grievance"

export const CPGRAMS_SLA_DAYS = 21

export type CpgramsStatus = "Receipt" | "Under Examination" | "Disposed" | "Appeal"

/** Map the platform grievance lifecycle to the CPGRAMS lifecycle. */
export function mapLocalStatus(status: GrievanceStatus): CpgramsStatus {
  switch (status) {
    case "open":
      return "Receipt"
    case "in_progress":
    case "escalated":
      return "Under Examination"
    case "resolved":
      return "Disposed"
  }
}

export interface CpgramsCase {
  /** CPGRAMS registration number (e.g. DOSEL/E/2026/0012345). */
  registrationNo: string
  /** Originating platform grievance id. */
  localId: string
  /** Mapped ministry / department. */
  ministry: string
  subject: string
  status: CpgramsStatus
  /** ISO date the case was forwarded to CPGRAMS (starts the clock). */
  forwardedAt: string
}

export const CPGRAMS_CASES: CpgramsCase[] = [
  { registrationNo: "DOSEL/E/2026/0012345", localId: "GRV-1041", ministry: "Dept of School Education & Literacy", subject: "Safeguarding lapse — district inaction", status: "Under Examination", forwardedAt: "2026-05-12" },
  { registrationNo: "DOSEL/E/2026/0012410", localId: "GRV-1043", ministry: "Dept of School Education & Literacy", subject: "Unauthorised fee collection — private school", status: "Under Examination", forwardedAt: "2026-05-28" },
  { registrationNo: "DBTL/E/2026/0008891", localId: "GRV-1042", ministry: "DBT Mission", subject: "Scholarship credit not received — cluster", status: "Under Examination", forwardedAt: "2026-05-20" },
  { registrationNo: "DOSEL/E/2026/0011002", localId: "GRV-0990", ministry: "Dept of School Education & Literacy", subject: "RTE 25% admission denial", status: "Disposed", forwardedAt: "2026-04-10" },
  { registrationNo: "DOSEL/E/2026/0012500", localId: "GRV-1046", ministry: "Dept of School Education & Literacy", subject: "Transport safety — unvetted driver", status: "Receipt", forwardedAt: "2026-06-06" },
  { registrationNo: "DOSEL/A/2026/0000777", localId: "GRV-0901", ministry: "Dept of School Education & Literacy", subject: "Appeal — recognition withdrawal", status: "Appeal", forwardedAt: "2026-05-01" },
]

function daysBetween(fromISO: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(fromISO).getTime()) / 86_400_000)
}

export function daysPending(c: CpgramsCase, now: Date = new Date()): number {
  return daysBetween(c.forwardedAt, now)
}

/** Overdue = not disposed and past the 21-day CPGRAMS norm. */
export function isOverdue(c: CpgramsCase, now: Date = new Date()): boolean {
  return c.status !== "Disposed" && daysPending(c, now) > CPGRAMS_SLA_DAYS
}

/** Open CPGRAMS cases, most overdue first. */
export function federationQueue(now: Date = new Date(), items: CpgramsCase[] = CPGRAMS_CASES): CpgramsCase[] {
  return items
    .filter((c) => c.status !== "Disposed")
    .sort((a, b) => daysPending(b, now) - daysPending(a, now))
}

export interface CpgramsSummary {
  total: number
  pending: number
  disposed: number
  overdue: number
  /** Disposal rate as a percentage, 0–100. */
  disposalRatePct: number
}

export function cpgramsSummary(now: Date = new Date(), items: CpgramsCase[] = CPGRAMS_CASES): CpgramsSummary {
  const disposed = items.filter((c) => c.status === "Disposed").length
  return {
    total: items.length,
    pending: items.filter((c) => c.status !== "Disposed").length,
    disposed,
    overdue: items.filter((c) => isOverdue(c, now)).length,
    disposalRatePct: items.length === 0 ? 0 : Math.round((disposed / items.length) * 100),
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(now: Date = new Date(), items: CpgramsCase[] = CPGRAMS_CASES): string {
  const header = ["Registration No", "Local ID", "Ministry", "Subject", "Status", "Days pending", "Overdue"]
  const rows = items.map((c) =>
    [c.registrationNo, c.localId, c.ministry, c.subject, c.status, String(daysPending(c, now)), isOverdue(c, now) ? "yes" : "no"].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
