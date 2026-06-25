// VASA-EOS(SE) — Maintenance ticket form model + validation.
//
// A maintenance ticket is an asset-management act, not a free text box: it needs a location, a category, a
// substantive fault description, who reported it, a priority that is consistent with any declared safety hazard,
// and an optional estimated cost and preferred completion date that — if given — cannot be in the past. This is the
// rich form with per-field validation enforcing those rules, plus a completeness score. Pure + client-safe; the
// server action raises it into the MAINTENANCE workflow (Principal triages → Vendor completes → Principal closes).

// Canonical, client-safe constants for the maintenance domain. The server-only
// flow store re-exports these so existing imports keep working without pulling
// server modules (next/headers) into the client bundle.
export const MAINT_CATEGORIES = ["Electrical", "Plumbing", "Furniture", "Building", "IT / Smart class", "Sanitation"]
export type Priority = "low" | "medium" | "high"

export const MAINT_PRIORITIES: { value: Priority; label: string }[] = [
  { value: "low", label: "Low — routine, no disruption" },
  { value: "medium", label: "Medium — affects normal use" },
  { value: "high", label: "High — unsafe / blocks teaching" },
]

export interface MaintTicketForm {
  location: string
  category: string
  priority: Priority
  description: string
  reportedBy: string
  /** Optional estimated cost in ₹ (0 = unknown). */
  estimatedCost: number
  /** Optional preferred completion date (ISO yyyy-mm-dd). */
  preferredDate: string
  /** Declares the fault is a safety hazard — forces a high priority. */
  safetyHazard: boolean
  declaration: boolean
}

export function emptyTicket(): MaintTicketForm {
  return { location: "", category: "", priority: "medium", description: "", reportedBy: "", estimatedCost: 0, preferredDate: "", safetyHazard: false, declaration: false }
}

export type FieldErrors = Partial<Record<keyof MaintTicketForm, string>>

const MIN_DESCRIPTION = 20

export function validateTicket(f: MaintTicketForm, asOf: Date = new Date()): { ok: boolean; errors: FieldErrors } {
  const e: FieldErrors = {}
  if (!f.location.trim()) e.location = "A location (block / room) is required"
  if (!(MAINT_CATEGORIES as readonly string[]).includes(f.category)) e.category = "Select a category"
  if (f.description.trim().length < MIN_DESCRIPTION) e.description = `Describe the fault in at least ${MIN_DESCRIPTION} characters`
  if (!f.reportedBy.trim()) e.reportedBy = "Reporter name is required"

  if (f.safetyHazard && f.priority !== "high") e.priority = "A declared safety hazard must be raised at high priority"

  if (f.estimatedCost < 0) e.estimatedCost = "Estimated cost cannot be negative"

  if (f.preferredDate) {
    const d = new Date(f.preferredDate)
    if (Number.isNaN(d.getTime())) e.preferredDate = "Enter a valid date"
    else {
      const today = new Date(asOf.toISOString().slice(0, 10))
      if (d.getTime() < today.getTime()) e.preferredDate = "Preferred date cannot be in the past"
    }
  }

  if (!f.declaration) e.declaration = "You must confirm the fault details are accurate"

  return { ok: Object.keys(e).length === 0, errors: e }
}

const REQUIRED: (keyof MaintTicketForm)[] = ["location", "category", "reportedBy"]

export function completenessPct(f: MaintTicketForm): number {
  let filled = 0
  const total = REQUIRED.length + 2 // + description + declaration
  for (const k of REQUIRED) if (String(f[k]).trim()) filled++
  if (f.description.trim().length >= MIN_DESCRIPTION) filled++
  if (f.declaration) filled++
  return Math.round((filled / total) * 100)
}
