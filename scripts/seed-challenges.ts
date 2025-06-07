import type { ImplementationChallengeInput } from "@/app/tracking/challenges/types"

// Helper functions (can be kept if generateSampleChallenges uses them, or removed if not)
// const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
// const getRandomDateInRange = (start: Date, end: Date): string => {
//   return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split("T")[0];
// };

// The function now used by the server action
export function generateSampleChallenges(
  implementationStatusIds: string[],
  countPerImpl = 0,
): ImplementationChallengeInput[] {
  if (implementationStatusIds.length === 0) return []
  const challenges: ImplementationChallengeInput[] = []
  const severities: ImplementationChallengeInput["severity"][] = ["Low", "Medium", "High", "Critical"]
  const statuses: ImplementationChallengeInput["status"][] = ["Open", "In Progress", "Resolved", "Closed", "Escalated"]
  // Assuming challenge_type was a typo and meant category, or it needs to be added to ImplementationChallengeInput
  const categories: ImplementationChallengeInput["category"][] = [
    "Financial",
    "Administrative",
    "Technical",
    "Social",
    "Logistical",
    "Other",
  ]

  const challengesToGenerate = countPerImpl > 0 ? countPerImpl : Math.floor(Math.random() * 2) + 1 // 1 to 2 if random

  for (const statusId of implementationStatusIds) {
    for (let i = 0; i < challengesToGenerate; i++) {
      const reportedDate = new Date()
      reportedDate.setDate(reportedDate.getDate() - Math.floor(Math.random() * 30))
      const currentStatus = statuses[Math.floor(Math.random() * statuses.length)]
      challenges.push({
        implementation_status_id: statusId,
        challenge_title: `Challenge ${i + 1} for ${statusId.substring(0, 4)}`,
        description: `Description of challenge ${i + 1}.`,
        category: categories[Math.floor(Math.random() * categories.length)], // Using category
        severity: severities[Math.floor(Math.random() * severities.length)],
        status: currentStatus,
        reported_date: reportedDate.toISOString().split("T")[0],
        resolved_date:
          currentStatus === "Resolved" || currentStatus === "Closed"
            ? new Date().toISOString().split("T")[0]
            : undefined,
        resolution_details:
          currentStatus === "Resolved" || currentStatus === "Closed" ? "Resolved via standard procedure." : undefined, // Added resolution_details
        reported_by: "SystemSeed", // Matched type
        assigned_to: currentStatus === "Open" || currentStatus === "In Progress" ? "Relevant Team" : undefined, // Matched type
        // mitigation_plan is not in ImplementationChallengeInput, removing or add to type
      })
    }
  }
  return challenges
}

// Removed the old generateSeedChallengesData function and its direct execution block.
