export interface ImplementationChallenge {
  id: string // UUID
  implementation_status_id: string // UUID of the parent policy_implementation_status record
  challenge_title: string
  description?: string | null
  category?: "Financial" | "Administrative" | "Technical" | "Social" | "Logistical" | "Other" | null
  severity: "Low" | "Medium" | "High" | "Critical"
  status: "Open" | "In Progress" | "Resolved" | "Closed" | "Escalated"
  reported_date?: string | null // YYYY-MM-DD
  resolved_date?: string | null // YYYY-MM-DD
  resolution_details?: string | null
  reported_by?: string | null
  assigned_to?: string | null
  created_at: string // ISO Date string
  updated_at: string // ISO Date string
}

// This type is used for seeding and form submissions, excluding auto-generated fields like id, created_at, updated_at
export type ImplementationChallengeInput = Omit<ImplementationChallenge, "id" | "created_at" | "updated_at">

export const CHALLENGE_CATEGORIES: ImplementationChallenge["category"][] = [
  "Financial",
  "Administrative",
  "Technical",
  "Social",
  "Logistical",
  "Other",
]

export const CHALLENGE_SEVERITIES: ImplementationChallenge["severity"][] = ["Low", "Medium", "High", "Critical"]

export const CHALLENGE_STATUSES: ImplementationChallenge["status"][] = [
  "Open",
  "In Progress",
  "Resolved",
  "Closed",
  "Escalated",
]
