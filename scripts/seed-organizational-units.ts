import { createClient } from "@supabase/supabase-js"
import type { OrganizationalUnitInput } from "@/app/governance/types" // Assuming types are here

// Ensure these environment variables are set in your .env file for local execution
// or in your Vercel project environment variables.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "Supabase URL or Service Role Key is not defined. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.",
  )
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

async function seedOrganizationalUnits() {
  console.log("Starting to seed organizational units...")

  // 1. Fetch Governance Tiers
  const { data: tiers, error: tiersError } = await supabaseAdmin
    .from("governance_tiers")
    .select("id, name, level_order")
    .order("level_order", { ascending: true })

  if (tiersError) {
    console.error("Error fetching governance tiers:", tiersError.message)
    return
  }
  if (!tiers || tiers.length === 0) {
    console.error("No governance tiers found. Please seed them first (e.g., via 008-*.sql script).")
    return
  }
  console.log(`Fetched ${tiers.length} governance tiers.`)

  const getTierId = (name: string): number | undefined => tiers.find((t) => t.name === name)?.id

  const nationalTierId = getTierId("National")
  const stateTierId = getTierId("State")
  const districtTierId = getTierId("District")
  const blockTierId = getTierId("Block")
  // const schoolTierId = getTierId("School"); // If you want to go deeper

  if (!nationalTierId || !stateTierId || !districtTierId) {
    console.error("Could not find required tier IDs (National, State, District). Aborting.")
    return
  }

  // Helper function to insert OU
  async function insertOU(ouData: OrganizationalUnitInput): Promise<string | null> {
    // Use region_code for conflict resolution as it's marked unique in the schema
    // If name + parent_ou_id + tier_id should be unique, the table needs that constraint.
    const { data, error } = await supabaseAdmin.from("organizational_units").insert(ouData).select("id, name").single() // Assuming insert returns the created record

    if (error) {
      if (error.code === "23505") {
        // unique_violation
        // Try to fetch the existing one by a unique identifier if needed for parent_id
        const { data: existingOu, error: fetchError } = await supabaseAdmin
          .from("organizational_units")
          .select("id, name")
          .eq("region_code", ouData.region_code!) // Assuming region_code is the conflicting key
          .single()
        if (fetchError || !existingOu) {
          console.warn(
            `OU with region_code ${ouData.region_code} likely already exists but failed to fetch: ${error.message}`,
          )
          return null
        }
        console.log(
          `OU "${existingOu.name}" (Region: ${ouData.region_code}) already exists. Using existing ID: ${existingOu.id}`,
        )
        return existingOu.id
      } else {
        console.error(`Error inserting OU "${ouData.name}": ${error.message}`)
        return null
      }
    }
    if (data) {
      console.log(`Successfully inserted/found OU: "${data.name}" (ID: ${data.id})`)
      return data.id
    }
    return null
  }

  // 2. Seed National OU
  const nationalOUId = await insertOU({
    name: "Ministry of Education - India",
    tier_id: nationalTierId,
    parent_ou_id: null,
    region_code: "IND_NAT",
    contact_email: "contact@moe.gov.in",
    metadata: { description: "National governing body for education in India." },
  })

  if (!nationalOUId) {
    console.error("Failed to create or find National OU. Aborting further seeding.")
    return
  }

  // 3. Seed State OUs
  const states = [
    { name: "State Dept of Education - Maharashtra", region_code: "IND_MH", parent: nationalOUId },
    { name: "State Dept of Education - Karnataka", region_code: "IND_KA", parent: nationalOUId },
    { name: "State Dept of Education - Tamil Nadu", region_code: "IND_TN", parent: nationalOUId },
  ]

  const stateOUIds: { [key: string]: string } = {}

  for (const state of states) {
    const stateId = await insertOU({
      name: state.name,
      tier_id: stateTierId,
      parent_ou_id: state.parent,
      region_code: state.region_code,
      contact_email: `contact@${state.region_code.toLowerCase()}.gov.in`,
      metadata: { capital_city: state.name.split(" - ")[1] }, // Example metadata
    })
    if (stateId) {
      stateOUIds[state.region_code] = stateId
    }
  }

  // 4. Seed District OUs
  const districts = [
    // Maharashtra Districts
    { name: "District Education Office - Mumbai", region_code: "IND_MH_MUM", parent_region_code: "IND_MH" },
    { name: "District Education Office - Pune", region_code: "IND_MH_PUN", parent_region_code: "IND_MH" },
    // Karnataka Districts
    { name: "District Education Office - Bengaluru Urban", region_code: "IND_KA_BLR", parent_region_code: "IND_KA" },
    { name: "District Education Office - Mysuru", region_code: "IND_KA_MYS", parent_region_code: "IND_KA" },
    // Tamil Nadu Districts
    { name: "District Education Office - Chennai", region_code: "IND_TN_CHN", parent_region_code: "IND_TN" },
    { name: "District Education Office - Coimbatore", region_code: "IND_TN_CBE", parent_region_code: "IND_TN" },
  ]

  const districtOUIds: { [key: string]: string } = {}

  for (const district of districts) {
    const parentStateOUId = stateOUIds[district.parent_region_code]
    if (!parentStateOUId) {
      console.warn(`Could not find parent State OU for district ${district.name}. Skipping.`)
      continue
    }
    const districtId = await insertOU({
      name: district.name,
      tier_id: districtTierId,
      parent_ou_id: parentStateOUId,
      region_code: district.region_code,
      contact_email: `deo@${district.region_code.toLowerCase()}.gov.in`,
    })
    if (districtId) {
      districtOUIds[district.region_code] = districtId
    }
  }

  // 5. Seed Block OUs (Optional, example for one district)
  if (blockTierId && districtOUIds["IND_MH_PUN"]) {
    // Example: Pune District
    const blocks = [
      { name: "Block Education Office - Haveli", region_code: "IND_MH_PUN_HVL", parent_region_code: "IND_MH_PUN" },
      { name: "Block Education Office - Mulshi", region_code: "IND_MH_PUN_MUL", parent_region_code: "IND_MH_PUN" },
    ]
    for (const block of blocks) {
      const parentDistrictOUId = districtOUIds[block.parent_region_code]
      if (!parentDistrictOUId) {
        console.warn(`Could not find parent District OU for block ${block.name}. Skipping.`)
        continue
      }
      await insertOU({
        name: block.name,
        tier_id: blockTierId,
        parent_ou_id: parentDistrictOUId,
        region_code: block.region_code,
        contact_email: `beo@${block.region_code.toLowerCase()}.gov.in`,
      })
    }
  }

  console.log("Finished seeding organizational units.")
}

// Run the seeding function
seedOrganizationalUnits()
  .then(() => console.log("Organizational Unit seeding script completed."))
  .catch((err) => console.error("Error in Organizational Unit seeding script:", err))
