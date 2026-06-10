// VASA-EOS(SE) — teacher leave application form model + validation.
//
// A leave request is a transaction with real rules: the dates must form a valid range, the duration is computed
// (not typed), the reason must be substantive, and a medical leave beyond two days needs a certificate. This is
// the rich form with per-field validation and a computed day count. Pure + client-safe; the server action files
// it into the three-tier approval workflow (Principal → BEO → DEO).

import { leaveDays, type LeaveType, LEAVE_TYPES } from "@/lib/leave"

export { LEAVE_TYPES, type LeaveType }

export interface LeaveApplicationForm {
  teacher: string
  type: LeaveType | ""
  from: string // ISO yyyy-mm-dd
  to: string
  reason: string
  /** Substitute-teacher arrangement during the absence. */
  substitute: string
  /** Contact number while on leave (optional). */
  contact: string
  /** Whether a medical certificate is attached (required for medical leave > 2 days). */
  medicalCert: boolean
  declaration: boolean
}

export function emptyLeave(): LeaveApplicationForm {
  return { teacher: "", type: "", from: "", to: "", reason: "", substitute: "", contact: "", medicalCert: false, declaration: false }
}

export type FieldErrors = Partial<Record<keyof LeaveApplicationForm, string>>

const MIN_REASON = 10

/** Whole-day duration of the request (0 when the range is invalid/unset). */
export function durationDays(f: LeaveApplicationForm): number {
  if (!f.from || !f.to) return 0
  const a = new Date(f.from)
  const b = new Date(f.to)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b.getTime() < a.getTime()) return 0
  return leaveDays(f.from, f.to)
}

export function validateLeave(f: LeaveApplicationForm): { ok: boolean; errors: FieldErrors } {
  const e: FieldErrors = {}
  if (!f.teacher.trim()) e.teacher = "Teacher name is required"
  if (!f.type) e.type = "Select a leave type"
  if (!f.from) e.from = "Start date is required"
  if (!f.to) e.to = "End date is required"

  if (f.from && f.to) {
    const a = new Date(f.from)
    const b = new Date(f.to)
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) e.to = "Enter valid dates"
    else if (b.getTime() < a.getTime()) e.to = "End date cannot be before the start date"
  }

  const days = durationDays(f)
  if (f.reason.trim().length < MIN_REASON) e.reason = `Give a reason of at least ${MIN_REASON} characters`
  if (f.type === "medical" && days > 2 && !f.medicalCert) e.medicalCert = "A medical certificate is required for medical leave beyond 2 days"
  if (f.contact.trim() && !/^\d{10}$/.test(f.contact.trim())) e.contact = "Enter a 10-digit number or leave blank"
  if (!f.declaration) e.declaration = "You must accept the declaration"

  return { ok: Object.keys(e).length === 0, errors: e }
}

const REQUIRED: (keyof LeaveApplicationForm)[] = ["teacher", "type", "from", "to"]

export function completenessPct(f: LeaveApplicationForm): number {
  let filled = 0
  const total = REQUIRED.length + 2 // + reason + declaration
  for (const k of REQUIRED) if (String(f[k]).trim()) filled++
  if (f.reason.trim().length >= MIN_REASON) filled++
  if (f.declaration) filled++
  return Math.round((filled / total) * 100)
}
