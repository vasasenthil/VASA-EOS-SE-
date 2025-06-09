import { createClient } from "@supabase/supabase-js"

// Constants previously from app/tracking/stakeholders/types.ts
const STAKEHOLDER_CATEGORIES_DATA = [
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

const STAKEHOLDER_IMPLEMENTATION_ROLES_DATA = [
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "Supabase URL or Service Role Key is not defined. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.",
  )
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

async function seedStakeholderAttributes() {
  console.log("Starting to seed stakeholder categories and implementation roles...")

  // Seed Stakeholder Categories
  console.log("\nSeeding Stakeholder Categories...")
  for (const categoryName of STAKEHOLDER_CATEGORIES_DATA) {
    const { data, error } = await supabaseAdmin
      .from("stakeholder_categories")
      .insert({ name: categoryName, description: `${categoryName} category` }) // Add a generic description
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        // unique_violation
        console.log(`Stakeholder Category "${categoryName}" already exists.`)
      } else {
        console.error(`Error inserting Stakeholder Category "${categoryName}": ${error.message}`)
      }
    } else if (data) {
      console.log(`Successfully inserted Stakeholder Category: "${data.name}" (ID: ${data.id})`)
    }
  }

  // Seed Stakeholder Implementation Roles
  console.log("\nSeeding Stakeholder Implementation Roles...")
  for (const roleName of STAKEHOLDER_IMPLEMENTATION_ROLES_DATA) {
    const { data, error } = await supabaseAdmin
      .from("stakeholder_implementation_roles")
      .insert({ name: roleName, description: `${roleName} role in implementation` }) // Add a generic description
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        // unique_violation
        console.log(`Stakeholder Implementation Role "${roleName}" already exists.`)
      } else {
        console.error(`Error inserting Stakeholder Implementation Role "${roleName}": ${error.message}`)
      }
    } else if (data) {
      console.log(`Successfully inserted Stakeholder Implementation Role: "${data.name}" (ID: ${data.id})`)
    }
  }

  console.log("\nFinished seeding stakeholder attributes.")
}

seedStakeholderAttributes()
  .then(() => console.log("Stakeholder attributes seeding script completed."))
  .catch((err) => console.error("Error in stakeholder attributes seeding script:", err))
