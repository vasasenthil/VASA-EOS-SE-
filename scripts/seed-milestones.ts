import type { ImplementationMilestoneInput } from "@/app/tracking/milestones/types"

// Helper function (can be kept if generateSampleMilestones uses it, or removed if not)
// const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
// const getRandomDateInRange = (start: Date, end: Date): string => {
//   return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split("T")[0];
// };

// The function now used by the server action
export function generateSampleMilestones(
  implementationStatusIds: string[],
  countPerImpl = 0,
): ImplementationMilestoneInput[] {
  // Changed return type to ImplementationMilestoneInput
  if (implementationStatusIds.length === 0) return []
  const milestones: ImplementationMilestoneInput[] = []
  const statuses: ImplementationMilestoneInput["status"][] = [
    "Not Started",
    "In Progress",
    "Completed",
    "Delayed",
    "On Hold",
    "Cancelled",
  ] // Matched to type
  const entities = ["State Education Dept.", "District Office", "Partner NGO", "Tech Provider"]

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
        status: statuses[Math.floor(Math.random() * statuses.length)],
        responsible_entity: entities[Math.floor(Math.random() * entities.length)],
        notes: "Initial planning complete.",
        // actual_completion_date is optional and can be omitted if not set
      })
    }
  }
  return milestones
}

// Removed the old generateSeedMilestonesData function and its direct execution block.
