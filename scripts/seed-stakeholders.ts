import type { FullStakeholderSeedData } from "@/app/tracking/dashboard/actions" // Adjusted path
// Note: Supabase client for fetching implementation_status_ids is removed from here.
// The action `seedImplementationStakeholdersAction` will handle fetching/associating.
// This function will now focus on generating template stakeholder data.
// It will need a list of implementation_status_ids passed to it.

export const stakeholderTypesList: FullStakeholderSeedData["stakeholder_type"][] = [
  "Government Body",
  "State Education Department",
  "District Education Office",
  "Block Education Office",
  "School Management Committee (SMC)",
  "NGO/Civil Society Organization",
  "Educational Institution (School/College)",
  "University/Research Institution",
  "Industry Partner/Corporate",
  "Community Leader",
  "Parent Association",
  "Teacher Union/Association",
  "Student Body/Representative",
  "Funding Agency",
  "Technical Partner",
  "Media",
  "Other",
]

export const stakeholderRolesList: FullStakeholderSeedData["role_in_implementation"][] = [
  "Lead Implementer",
  "Supporting Implementer",
  "Funder",
  "Policy Design",
  "Advisor/Consultant",
  "Monitoring & Evaluation",
  "Advocacy & Awareness",
  "Capacity Building Provider",
  "Technology Provider",
  "Beneficiary Representative",
  "Affected Party",
  "Observer",
  "Other",
]

const engagementLevelsList: FullStakeholderSeedData["engagement_level"][] = [
  "High",
  "Medium",
  "Low",
  "Consulted",
  "Informed",
  "Partnered",
]
const influenceLevelsList: FullStakeholderSeedData["influence_level"][] = ["High", "Medium", "Low"]
const interestLevelsList: FullStakeholderSeedData["interest_level"][] = ["High", "Medium", "Low"]

export function generateSeedStakeholderData(
  implementationStatusIds: string[],
  countPerImplStatus = 2,
): FullStakeholderSeedData[] {
  const stakeholdersToSeed: FullStakeholderSeedData[] = []
  let stakeholderCounter = 1

  implementationStatusIds.forEach((implStatusId) => {
    for (let i = 0; i < countPerImplStatus; i++) {
      stakeholdersToSeed.push({
        implementation_status_id: implStatusId,
        stakeholder_name: `Stakeholder Org ${stakeholderCounter} for Impl ${implStatusId.substring(0, 4)}`,
        stakeholder_type: stakeholderTypesList[Math.floor(Math.random() * stakeholderTypesList.length)],
        role_in_implementation: stakeholderRolesList[Math.floor(Math.random() * stakeholderRolesList.length)],
        contact_person: `Contact Person ${stakeholderCounter}`,
        email: `contact${stakeholderCounter}@example.com`,
        phone: `+91-9876543${String(stakeholderCounter).padStart(3, "0")}`,
        engagement_level: engagementLevelsList[Math.floor(Math.random() * engagementLevelsList.length)],
        influence_level: influenceLevelsList[Math.floor(Math.random() * influenceLevelsList.length)],
        interest_level: interestLevelsList[Math.floor(Math.random() * interestLevelsList.length)],
        contribution_summary: `Expected to provide ${
          ["resources", "expertise", "feedback", "support"][Math.floor(Math.random() * 4)]
        }.`,
        challenges_anticipated: `Potential ${
          ["communication gaps", "resource constraints", "conflicting priorities"][Math.floor(Math.random() * 3)]
        }.`,
        notes: `Initial meeting held on ${new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ).toLocaleDateString()}.`,
      })
      stakeholderCounter++
    }
  })
  return stakeholdersToSeed
}

// The direct execution part is removed as this file will now only export the generator function.
// The Supabase client and direct seeding logic are handled by the server action.
