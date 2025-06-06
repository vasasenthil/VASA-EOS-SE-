export interface ImplementationMilestone {
  id: string // UUID
  implementation_status_id: string // UUID of the parent policy_implementation_status record
  milestone_name: string
  description?: string | null
  target_date?: string | null // ISO Date string
  actual_completion_date?: string | null // ISO Date string
  status: MilestoneStatus
  responsible_entity?: string | null
  notes?: string | null
  created_at: string // ISO Date string
  updated_at: string // ISO Date string
}

export type ImplementationMilestoneInput = Omit<ImplementationMilestone, "id" | "created_at" | "updated_at">

export const MILESTONE_STATUSES = [
  "Not Started",
  "In Progress",
  "Completed",
  "Delayed",
  "On Hold",
  "Cancelled",
] as const
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number]

export const milestoneStatusColors: { [key in MilestoneStatus]: string } = {
  "Not Started": "bg-gray-100 text-gray-700 border-gray-300",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-300",
  Completed: "bg-green-100 text-green-700 border-green-300",
  Delayed: "bg-red-100 text-red-700 border-red-300",
  "On Hold": "bg-orange-100 text-orange-700 border-orange-300",
  Cancelled: "bg-gray-200 text-gray-500 border-gray-400",
}
