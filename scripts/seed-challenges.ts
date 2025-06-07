import type { ImplementationChallengeInput } from "@/app/tracking/challenges/types"

interface ImplementationChallengeSeed {
  implementation_status_id: string // UUID of the parent policy_implementation_status record
  challenge_title: string
  description?: string
  category?: "Financial" | "Administrative" | "Technical" | "Social" | "Logistical" | "Other"
  severity: "Low" | "Medium" | "High" | "Critical"
  status: "Open" | "In Progress" | "Resolved" | "Closed" | "Escalated"
  reported_date?: string
  resolved_date?: string
  resolution_details?: string
  reported_by?: string
  assigned_to?: string
}

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

const getRandomDateInRange = (start: Date, end: Date): string => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split("T")[0]
}

const generateSeedChallengesData = (
  implementationStatusIds: string[],
  challengesPerImplementation = 2,
): ImplementationChallengeSeed[] => {
  const challengesData: ImplementationChallengeSeed[] = []
  const challengeTitles = [
    "Insufficient Budget Allocation",
    "Lack of Trained Personnel",
    "Technical Infrastructure Gaps",
    "Low Community Awareness/Engagement",
    "Logistical Delays in Material Distribution",
    "Resistance to Change from Stakeholders",
    "Data Collection and Monitoring Issues",
    "Inter-departmental Coordination Gaps",
    "Outdated Regulatory Hurdles",
    "Procurement Process Delays",
  ]
  const categories: ImplementationChallengeSeed["category"][] = [
    "Financial",
    "Administrative",
    "Technical",
    "Social",
    "Logistical",
    "Other",
  ]
  const severities: ImplementationChallengeSeed["severity"][] = ["Low", "Medium", "High", "Critical"]
  const statuses: ImplementationChallengeSeed["status"][] = ["Open", "In Progress", "Resolved", "Closed", "Escalated"]
  const reporters = ["Field Officer A", "State Coordinator B", "System Alert", "Teacher Union Rep"]
  const assignees = ["Task Force Alpha", "Tech Support Team", "Finance Department", "Regional Director"]

  const baseReportDateStart = new Date(2023, 8, 1) // Sep 1, 2023
  const baseReportDateEnd = new Date() // Today

  for (const statusId of implementationStatusIds) {
    const numChallenges = Math.floor(Math.random() * challengesPerImplementation) + 1

    for (let i = 0; i < numChallenges; i++) {
      const title = getRandomElement(challengeTitles)
      const status = getRandomElement(statuses)
      const reportedDate = getRandomDateInRange(baseReportDateStart, baseReportDateEnd)
      let resolvedDate: string | undefined
      let resolutionDetails: string | undefined

      if (status === "Resolved" || status === "Closed") {
        const reportedDateObj = new Date(reportedDate)
        const resolutionStartDate = new Date(reportedDateObj)
        resolutionStartDate.setDate(resolutionStartDate.getDate() + 7) // Resolution takes at least a week
        const resolutionEndDate = new Date(resolutionStartDate)
        resolutionEndDate.setMonth(resolutionEndDate.getMonth() + 2) // Max 2 months to resolve
        resolvedDate = getRandomDateInRange(
          resolutionStartDate,
          resolutionEndDate > new Date() ? new Date() : resolutionEndDate,
        )
        resolutionDetails = `Challenge addressed by ${getRandomElement(assignees)}. Key actions: ${Math.random() > 0.5 ? "Increased funding, " : ""}Conducted workshops, Updated guidelines.`
      }

      challengesData.push({
        implementation_status_id: statusId,
        challenge_title: `${title} (for ${statusId.substring(0, 8)})`,
        description: `Detailed description of ${title.toLowerCase()} impacting implementation ${statusId}. Specific issues include...`,
        category: getRandomElement(categories),
        severity: getRandomElement(severities),
        status: status,
        reported_date: reportedDate,
        resolved_date: resolvedDate,
        resolution_details: resolutionDetails,
        reported_by: getRandomElement(reporters),
        assigned_to: status === "Open" || status === "In Progress" ? getRandomElement(assignees) : undefined,
      })
    }
  }
  return challengesData
}

export function generateSampleChallenges(
  implementationStatusIds: string[],
  countPerImpl = 0,
): ImplementationChallengeInput[] {
  if (implementationStatusIds.length === 0) return []
  const challenges: ImplementationChallengeInput[] = []
  const severities = ["Low", "Medium", "High", "Critical"]
  const statuses = ["Open", "In Progress", "Resolved", "Closed", "Escalated"]
  const types = ["Funding", "Resource", "Technical", "Administrative", "Community Acceptance"]

  // If countPerImpl is 0 or not provided, generate a random number of challenges per implementation status
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
        challenge_type: types[Math.floor(Math.random() * types.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        status: currentStatus,
        reported_date: reportedDate.toISOString().split("T")[0],
        resolved_date:
          currentStatus === "Resolved" || currentStatus === "Closed"
            ? new Date().toISOString().split("T")[0]
            : undefined,
        mitigation_plan: "Plan to address this challenge.",
        reported_by: "System/User",
      })
    }
  }
  return challenges
}

// Main execution for the script
try {
  // In a real scenario, you'd fetch existing implementation_status_ids from the database.
  // For this script, we'll use placeholder IDs.
  // Replace with actual UUIDs from your 'policy_implementation_status' table after seeding it.
  const placeholderImplementationStatusIds = [
    "uuid-placeholder-impl-status-1", // Replace with actual UUIDs
    "uuid-placeholder-impl-status-2",
    "uuid-placeholder-impl-status-3",
    "uuid-placeholder-impl-status-4",
    "uuid-placeholder-impl-status-5",
    "uuid-placeholder-impl-status-6",
    "uuid-placeholder-impl-status-7",
  ]

  const seededChallenges = generateSeedChallengesData(placeholderImplementationStatusIds, 3) // Avg 3 challenges per implementation

  console.log(`Generated ${seededChallenges.length} implementation challenge entries.`)
  console.log("---CHALLENGE_SEED_DATA_START---")
  console.log(JSON.stringify(seededChallenges, null, 2))
  console.log("---CHALLENGE_SEED_DATA_END---")
} catch (error) {
  console.error("Error generating implementation challenge seed data:", error)
}

export { generateSeedChallengesData }
