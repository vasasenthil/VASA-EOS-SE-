import type { ImplementationMilestoneSeed } from "@/app/tracking/dashboard/actions"

interface ImplementationMilestoneSeedOld {
  implementation_status_id: string // UUID of the parent policy_implementation_status record
  milestone_name: string
  description?: string
  target_date?: string
  actual_completion_date?: string
  status: "Pending" | "In Progress" | "Completed" | "Delayed" | "Blocked" | "Cancelled"
  responsible_entity?: string
  notes?: string
}

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

const getRandomDateInRange = (start: Date, end: Date): string => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split("T")[0]
}

const generateSeedMilestonesData = (
  implementationStatusIds: string[],
  milestonesPerImplementation = 3,
): ImplementationMilestoneSeedOld[] => {
  const milestonesData: ImplementationMilestoneSeedOld[] = []
  const milestoneNames = [
    "Initial Planning & Resource Allocation",
    "Stakeholder Consultation Phase 1",
    "Develop Training Materials",
    "Pilot Program Launch",
    "Technology Platform Setup",
    "State-Level Workshops",
    "Monitoring Framework Design",
    "Data Collection System Rollout",
    "Mid-Term Review & Adjustments",
    "Final Evaluation Report",
    "Knowledge Dissemination Activities",
  ]
  const statuses: ImplementationMilestoneSeedOld["status"][] = [
    "Pending",
    "In Progress",
    "Completed",
    "Delayed",
    "Blocked",
  ]
  const responsibleEntities = [
    "Central Project Team",
    "State Nodal Agency",
    "District Education Office",
    "Technology Partner",
    "Curriculum Development Wing",
  ]

  const baseStartDate = new Date(2023, 6, 1) // July 1, 2023
  const baseEndDate = new Date(2025, 11, 31) // Dec 31, 2025

  for (const statusId of implementationStatusIds) {
    const numMilestones = Math.floor(Math.random() * milestonesPerImplementation) + 1 // 1 to milestonesPerImplementation
    let lastTargetDate = new Date(baseStartDate)

    for (let i = 0; i < numMilestones; i++) {
      const milestoneName = getRandomElement(milestoneNames) + ` (Phase ${i + 1})`
      const status = getRandomElement(statuses)

      // Ensure target dates are sequential
      const targetStartDate = new Date(lastTargetDate)
      targetStartDate.setDate(targetStartDate.getDate() + 7) // Next milestone starts at least a week later
      const targetEndDate = new Date(targetStartDate)
      targetEndDate.setMonth(targetEndDate.getMonth() + (Math.floor(Math.random() * 3) + 1)) // Duration 1-3 months
      const targetDate = getRandomDateInRange(
        targetStartDate,
        targetEndDate > baseEndDate ? baseEndDate : targetEndDate,
      )
      lastTargetDate = new Date(targetDate)

      let actualCompletionDate: string | undefined
      if (status === "Completed") {
        const completionStartDate = new Date(targetStartDate)
        completionStartDate.setDate(completionStartDate.getDate() - 14) // Could be completed earlier
        const completionEndDate = new Date(targetDate)
        completionEndDate.setDate(completionEndDate.getDate() + 14) // Or slightly later
        actualCompletionDate = getRandomDateInRange(
          completionStartDate < baseStartDate ? baseStartDate : completionStartDate,
          completionEndDate > new Date() ? new Date() : completionEndDate, // Cannot be in future
        )
      }

      milestonesData.push({
        implementation_status_id: statusId,
        milestone_name: milestoneName,
        description: `Detailed tasks for ${milestoneName} for implementation ID ${statusId}.`,
        target_date: targetDate,
        actual_completion_date: actualCompletionDate,
        status: status,
        responsible_entity: getRandomElement(responsibleEntities),
        notes: Math.random() > 0.7 ? `Additional notes for ${milestoneName}.` : undefined,
      })
    }
  }
  return milestonesData
}

export function generateSampleMilestones(
  implementationStatusIds: string[],
  countPerImpl = 0,
): ImplementationMilestoneSeed[] {
  if (implementationStatusIds.length === 0) return []
  const milestones: ImplementationMilestoneSeed[] = []
  const statuses = ["Planned", "In Progress", "Completed", "Delayed", "On Hold"]
  const entities = ["State Education Dept.", "District Office", "Partner NGO", "Tech Provider"]

  // If countPerImpl is 0 or not provided, generate a random number of milestones per implementation status
  const milestonesToGenerate = countPerImpl > 0 ? countPerImpl : Math.floor(Math.random() * 3) + 2 // 2 to 4 if random

  for (const statusId of implementationStatusIds) {
    for (let i = 0; i < milestonesToGenerate; i++) {
      const targetDays = Math.floor(Math.random() * 90) + 30
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + targetDays)
      milestones.push({
        implementation_status_id: statusId,
        milestone_name: `Milestone ${i + 1} for ${statusId.substring(0, 4)}`,
        description: `Key objective ${i + 1} for this phase.`,
        target_date: targetDate.toISOString().split("T")[0],
        status: statuses[Math.floor(Math.random() * statuses.length)] as any, // TODO: Fix type issue
        responsible_entity: entities[Math.floor(Math.random() * entities.length)],
        notes: "Initial planning complete.",
      })
    }
  }
  return milestones
}

// Main execution for the script
try {
  // In a real scenario, you'd fetch existing implementation_status_ids from the database.
  // For this script, we'll use placeholder IDs.
  // Assume `seedPolicyImplementationAction` has been run.
  // Replace with actual IDs from your 'policy_implementation_status' table.
  const placeholderImplementationStatusIds = [
    "uuid-placeholder-impl-status-1", // Replace with actual UUIDs
    "uuid-placeholder-impl-status-2",
    "uuid-placeholder-impl-status-3",
    "uuid-placeholder-impl-status-4",
    "uuid-placeholder-impl-status-5",
  ]

  const seededMilestones = generateSeedMilestonesData(placeholderImplementationStatusIds, 4) // Avg 4 milestones per implementation

  console.log(`Generated ${seededMilestones.length} implementation milestone entries.`)
  console.log("---MILESTONE_SEED_DATA_START---")
  console.log(JSON.stringify(seededMilestones, null, 2))
  console.log("---MILESTONE_SEED_DATA_END---")
} catch (error) {
  console.error("Error generating implementation milestone seed data:", error)
}

export { generateSeedMilestonesData }
