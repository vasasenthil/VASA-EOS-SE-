import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"

config({ path: ".env.local" }) // Ensure your .env.local has SUPABASE_URL and SUPABASE_SERVICE_KEY

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase URL or Service Key is not defined in .env.local")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface StakeholderSeedData {
  implementation_status_id: string
  stakeholder_name: string
  stakeholder_type:
    | "Government Body"
    | "State Education Department"
    | "District Education Office"
    | "Block Education Office"
    | "School Management Committee (SMC)"
    | "NGO/Civil Society Organization"
    | "Educational Institution (School/College)"
    | "University/Research Institution"
    | "Industry Partner/Corporate"
    | "Community Leader"
    | "Parent Association"
    | "Teacher Union/Association"
    | "Student Body/Representative"
    | "Funding Agency"
    | "Technical Partner"
    | "Media"
    | "Other"
  role_in_implementation:
    | "Lead Implementer"
    | "Supporting Implementer"
    | "Funder"
    | "Policy Design"
    | "Advisor/Consultant"
    | "Monitoring & Evaluation"
    | "Advocacy & Awareness"
    | "Capacity Building Provider"
    | "Technology Provider"
    | "Beneficiary Representative"
    | "Affected Party"
    | "Observer"
    | "Other"
  contact_person?: string
  email?: string
  phone?: string
  engagement_level?: "High" | "Medium" | "Low" | "Consulted" | "Informed" | "Partnered"
  influence_level?: "High" | "Medium" | "Low"
  interest_level?: "High" | "Medium" | "Low"
  contribution_summary?: string
  challenges_anticipated?: string
  notes?: string
}

async function seedStakeholders() {
  console.log("Fetching existing implementation status IDs...")
  const { data: implementationStatuses, error: implError } = await supabase
    .from("policy_implementation_status")
    .select("id, policy_id, region_name")
    .limit(10) // Fetch a few to associate stakeholders with

  if (implError) {
    console.error("Error fetching implementation statuses:", implError)
    return
  }

  if (!implementationStatuses || implementationStatuses.length === 0) {
    console.log("No implementation statuses found. Skipping stakeholder seeding.")
    return
  }

  console.log(`Found ${implementationStatuses.length} implementation statuses.`)

  const stakeholdersToSeed: StakeholderSeedData[] = []

  implementationStatuses.forEach((implStatus, index) => {
    // Add 1-3 stakeholders per implementation status for variety
    const numStakeholders = Math.floor(Math.random() * 3) + 1
    for (let i = 0; i < numStakeholders; i++) {
      const stakeholderTypes: StakeholderSeedData["stakeholder_type"][] = [
        "State Education Department",
        "NGO/Civil Society Organization",
        "School Management Committee (SMC)",
        "Teacher Union/Association",
        "Parent Association",
      ]
      const roles: StakeholderSeedData["role_in_implementation"][] = [
        "Supporting Implementer",
        "Monitoring & Evaluation",
        "Beneficiary Representative",
        "Advocacy & Awareness",
        "Capacity Building Provider",
      ]
      const engagementLevels: StakeholderSeedData["engagement_level"][] = ["High", "Medium", "Consulted", "Informed"]
      const influenceLevels: StakeholderSeedData["influence_level"][] = ["High", "Medium", "Low"]
      const interestLevels: StakeholderSeedData["interest_level"][] = ["High", "Medium", "Low"]

      stakeholdersToSeed.push({
        implementation_status_id: implStatus.id,
        stakeholder_name: `Stakeholder Org ${index * 3 + i + 1} for ${implStatus.region_name}`,
        stakeholder_type: stakeholderTypes[Math.floor(Math.random() * stakeholderTypes.length)],
        role_in_implementation: roles[Math.floor(Math.random() * roles.length)],
        contact_person: `Contact Person ${index * 3 + i + 1}`,
        email: `contact${index * 3 + i + 1}@example.com`,
        phone: `+91-9876543${String(index * 10 + i).padStart(3, "0")}`,
        engagement_level: engagementLevels[Math.floor(Math.random() * engagementLevels.length)],
        influence_level: influenceLevels[Math.floor(Math.random() * influenceLevels.length)],
        interest_level: interestLevels[Math.floor(Math.random() * interestLevels.length)],
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
    }
  })

  if (stakeholdersToSeed.length === 0) {
    console.log("No stakeholders to seed based on available implementation statuses.")
    return
  }

  console.log(`Attempting to seed ${stakeholdersToSeed.length} stakeholders...`)

  // Clear existing stakeholders for the selected implementation_status_ids to avoid duplicates on re-seed
  const uniqueImplStatusIds = [...new Set(stakeholdersToSeed.map((s) => s.implementation_status_id))]
  if (uniqueImplStatusIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("implementation_stakeholders")
      .delete()
      .in("implementation_status_id", uniqueImplStatusIds)
    if (deleteError) {
      console.warn("Warning clearing existing stakeholder data:", deleteError.message)
    } else {
      console.log("Cleared existing stakeholders for selected implementation statuses.")
    }
  }

  const { data, error } = await supabase.from("implementation_stakeholders").insert(stakeholdersToSeed).select()

  if (error) {
    console.error("Error seeding stakeholders:", error)
  } else {
    console.log(`Successfully seeded ${data?.length || 0} stakeholders.`)
  }
}

seedStakeholders().catch(console.error)
