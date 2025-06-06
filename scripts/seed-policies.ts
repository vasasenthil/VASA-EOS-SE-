// This is a script to seed the in-memory policiesStore.
// It will be executed in the Node.js environment provided by the Code Project.
// To use this, you'll typically call a server action that then calls this script's logic,
// or adapt this to directly manipulate the store if run in the same context.
// For this demo, we'll assume this script's output can be used to populate the store.

// IMPORTANT: In a real application, this script would interact with your actual database.
// Since policiesStore is in 'app/policies/create/actions.ts', directly modifying it from
// here isn't straightforward in a typical Next.js build.
// For v0's environment, we'll define the seed data and a function.
// We'll then need to modify 'actions.ts' to have a dedicated seeding action
// that uses this data.

import type { PolicyDraft } from "../app/policies/create/policy-form-constants"
import {
  POLICY_DOMAINS,
  NEP_THRUST_AREAS,
  TARGET_AUDIENCES,
  REVIEW_COMMITTEES,
} from "../app/policies/create/policy-form-constants"

const getRandomId = () => `POL-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

const getRandomDate = (start: Date, end: Date): string => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString()
}

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const getRandomElements = <T,>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

const generateSeedPolicies = (count = 30): PolicyDraft[] => {
  const policies: PolicyDraft[] = []
  const startDate = new Date(2023, 0, 1) // Jan 1, 2023
  const endDate = new Date() // Today

  const statuses: PolicyDraft["status"][] = [
    "Draft",
    "Pending Internal Review",
    "Under Stakeholder Consultation",
    "Approved",
  ]

  for (let i = 0; i < count; i++) {
    const createdAtDate = new Date(getRandomDate(startDate, endDate))
    const lastModifiedDate = new Date(getRandomDate(createdAtDate, endDate)) // ensure lastModified is after createdAt

    const policy: PolicyDraft = {
      id: getRandomId(),
      title: `Sample Policy Draft #${i + 1}: Focus on ${getRandomElement(POLICY_DOMAINS).toLowerCase()}`,
      policyDomain: getRandomElement(POLICY_DOMAINS),
      version: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 5)}`,
      abstractEN: `This is a sample abstract for policy #${i + 1}. It outlines key strategies for improving ${getRandomElement(NEP_THRUST_AREAS).toLowerCase()} and targets various stakeholders including ${getRandomElements(TARGET_AUDIENCES, 2).join(" and ")}. The current status is ${statuses[i % statuses.length]}.`,
      abstractHI: `यह नीति #${i + 1} के लिए एक नमूना सार है।`,
      keywords: getRandomElements(
        ["education", "reform", "digital", "skill", "assessment", "curriculum", "teacher training", "innovation"],
        Math.floor(Math.random() * 3) + 1,
      ),
      targetAudience: getRandomElements(TARGET_AUDIENCES, Math.floor(Math.random() * 3) + 2),
      leadDrafter: `User ${String.fromCharCode(65 + (i % 5))}`, // User A, B, C, D, E
      nepThrustAreas: getRandomElements(NEP_THRUST_AREAS, Math.floor(Math.random() * 2) + 1),
      nepAlignmentJustification: `This policy aligns with NEP 2020 by focusing on ${getRandomElement(NEP_THRUST_AREAS)}.`,
      draftPolicyDocument: {
        name: `draft_policy_${i + 1}.pdf`,
        type: "application/pdf",
        size: Math.floor(Math.random() * 5000000) + 100000,
      },
      annexures:
        Math.random() > 0.5
          ? [
              {
                name: `annexure_${i + 1}_ref.docx`,
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                size: Math.floor(Math.random() * 1000000) + 50000,
              },
            ]
          : null,
      internalReviewCommittee: getRandomElements(REVIEW_COMMITTEES, Math.floor(Math.random() * 2) + 1),
      status: statuses[i % statuses.length],
      createdAt: createdAtDate.toISOString(),
      lastModified: lastModifiedDate.toISOString(),
    }
    policies.push(policy)
  }
  return policies
}

// Main execution for the script
try {
  const seededPolicies = generateSeedPolicies(35) // Generate 35 policies
  // In a real scenario, you'd use a database client here to insert/update.
  // For v0, this script will output the data, and we'll create an action to use it.
  console.log(`Generated ${seededPolicies.length} policies.`)
  // To make this usable by an action, we'll print the JSON.
  // The action can then parse this.
  console.log("---SEED_DATA_START---")
  console.log(JSON.stringify(seededPolicies, null, 2))
  console.log("---SEED_DATA_END---")

  // This provides a way for the calling environment (like a server action)
  // to capture the generated data if it can read stdout.
} catch (error) {
  console.error("Error generating seed data:", error)
  // process.exit(1); // Not available in Next.js, but good practice for CLI scripts
}

// To make this script directly usable for providing data (e.g. to a server action)
// we can export the generation function.
export { generateSeedPolicies }
