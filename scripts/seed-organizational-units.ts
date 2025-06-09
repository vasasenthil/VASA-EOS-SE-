import { createClient } from "@supabase/supabase-js"
import type { OrganizationalUnitInput } from "@/app/governance/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "Supabase URL or Service Role Key is not defined. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.",
  )
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

interface TierMap {
  [key: string]: number // Tier Name to Tier ID
}

async function seedHierarchicalOrganizationalUnits() {
  console.log("Starting to seed hierarchical organizational units for Education Ecosystem...")

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
    console.error("No governance tiers found. Please ensure '010-define-education-governance-tiers.sql' has been run.")
    return
  }
  console.log(`Fetched ${tiers.length} governance tiers.`)

  const tierMap: TierMap = tiers.reduce((acc, tier) => {
    acc[tier.name] = tier.id
    return acc
  }, {} as TierMap)

  const getTierId = (name: string): number | undefined => tierMap[name]

  // Helper function to insert OU and handle potential conflicts by region_code or name+parent
  async function insertOU(ouData: OrganizationalUnitInput, uniqueKey?: string): Promise<string | null> {
    const conflictTarget = uniqueKey || (ouData.parent_ou_id ? "name, parent_ou_id" : "name")

    // Attempt to insert
    const { data, error } = await supabaseAdmin.from("organizational_units").insert(ouData).select("id, name").single()

    if (error) {
      if (error.code === "23505") {
        // unique_violation
        // Try to fetch the existing OU
        let query = supabaseAdmin.from("organizational_units").select("id, name")
        if (uniqueKey && ouData.region_code) {
          query = query.eq(uniqueKey, ouData.region_code)
        } else {
          query = query.eq("name", ouData.name)
          if (ouData.parent_ou_id) {
            query = query.eq("parent_ou_id", ouData.parent_ou_id)
          } else {
            query = query.is("parent_ou_id", null)
          }
        }
        query = query.eq("tier_id", ouData.tier_id) // Ensure tier matches too

        const { data: existingOu, error: fetchError } = await query.single()

        if (fetchError || !existingOu) {
          console.warn(
            `OU "${ouData.name}" likely already exists but failed to fetch it (conflict on ${conflictTarget}): ${fetchError?.message || "Not found"}. Original error: ${error.message}`,
          )
          return null
        }
        console.log(
          `OU "${existingOu.name}" (Tier: ${ouData.tier_id}) already exists. Using existing ID: ${existingOu.id}`,
        )
        return existingOu.id
      } else {
        console.error(`Error inserting OU "${ouData.name}": ${error.message}`)
        return null
      }
    }
    if (data) {
      console.log(`Successfully inserted OU: "${data.name}" (ID: ${data.id})`)
      return data.id
    }
    return null
  }

  // --- Seed Central Level OUs ---
  const centralTierId = getTierId("Central Level")
  if (!centralTierId) {
    console.error("Central Level tier not found. Aborting.")
    return
  }

  const centralEntities = [
    { name: "Ministry of Education (MoE)", region_code: "IND_MOE", metadata: { acronym: "MoE" } },
    {
      name: "Department of School Education & Literacy (DoSEL)",
      region_code: "IND_DOSEL",
      metadata: { acronym: "DoSEL", parent_body: "MoE" },
    },
    {
      name: "National Council of Educational Research and Training (NCERT)",
      region_code: "IND_NCERT",
      metadata: { acronym: "NCERT" },
    },
    { name: "Central Board of Secondary Education (CBSE)", region_code: "IND_CBSE", metadata: { acronym: "CBSE" } },
    { name: "National Institute of Open Schooling (NIOS)", region_code: "IND_NIOS", metadata: { acronym: "NIOS" } },
    { name: "National Council for Teacher Education (NCTE)", region_code: "IND_NCTE", metadata: { acronym: "NCTE" } },
    {
      name: "Performance Assessment, Review, and Analysis of Knowledge for Holistic Development (PARAKH)",
      region_code: "IND_PARAKH",
      metadata: { acronym: "PARAKH" },
    },
    { name: "Kendriya Vidyalaya Sangathan (KVS)", region_code: "IND_KVS_HQ", metadata: { acronym: "KVS HQ" } },
    { name: "Navodaya Vidyalaya Samiti (NVS)", region_code: "IND_NVS_HQ", metadata: { acronym: "NVS HQ" } },
    // SCERT Coordination Cell might be under NCERT or MoE, assuming MoE for now
    { name: "SCERT Coordination Cell", region_code: "IND_SCC", metadata: { parent_body: "MoE" } },
    {
      name: "National Commission for Protection of Child Rights (NCPCR)",
      region_code: "IND_NCPCR",
      metadata: { acronym: "NCPCR" },
    },
  ]

  const centralOUIds: { [key: string]: string } = {}
  for (const entity of centralEntities) {
    const ouId = await insertOU(
      {
        name: entity.name,
        tier_id: centralTierId,
        parent_ou_id: null, // All central bodies are top-level for now, or specify parent if DoSEL is under MoE etc.
        region_code: entity.region_code,
        contact_email: `info@${entity.metadata.acronym?.toLowerCase() || entity.name.split(" ")[0].toLowerCase()}.gov.in`,
        metadata: entity.metadata,
      },
      "region_code",
    )
    if (ouId) centralOUIds[entity.region_code] = ouId
  }
  // Example: Set DoSEL as child of MoE if MoE was created
  if (centralOUIds["IND_MOE"] && centralOUIds["IND_DOSEL"]) {
    await supabaseAdmin
      .from("organizational_units")
      .update({ parent_ou_id: centralOUIds["IND_MOE"] })
      .eq("id", centralOUIds["IND_DOSEL"])
    console.log("Updated DoSEL to be a child of MoE.")
  }

  // --- Seed State/UT Level OUs ---
  const stateTierId = getTierId("State/UT Level")
  if (!stateTierId) {
    console.error("State/UT Level tier not found. Skipping state OUs.")
  } else {
    const states = [
      { name: "Department of School Education - Maharashtra", region_code: "MH_DSE", parent_region_code: "IND_MOE" }, // Parent is MoE for policy alignment
      { name: "Department of School Education - Karnataka", region_code: "KA_DSE", parent_region_code: "IND_MOE" },
      { name: "SCERT Maharashtra", region_code: "MH_SCERT", parent_region_code: "MH_DSE" }, // SCERT under State DSE
      { name: "SCERT Karnataka", region_code: "KA_SCERT", parent_region_code: "KA_DSE" },
      {
        name: "Maharashtra State Board of Secondary & Higher Secondary Education",
        region_code: "MH_MSBSHSE",
        parent_region_code: "MH_DSE",
      },
    ]
    const stateOUIds: { [key: string]: string } = {}
    for (const state of states) {
      const parentId = centralOUIds[state.parent_region_code] || stateOUIds[state.parent_region_code] // Check both central and already created state OUs
      const ouId = await insertOU(
        {
          name: state.name,
          tier_id: stateTierId,
          parent_ou_id: parentId || null,
          region_code: state.region_code,
          contact_email: `contact@${state.region_code.toLowerCase()}.gov.in`,
        },
        "region_code",
      )
      if (ouId) stateOUIds[state.region_code] = ouId
    }

    // --- Seed District Level OUs (Example for Maharashtra) ---
    const districtTierId = getTierId("District Level")
    if (!districtTierId) {
      console.error("District Level tier not found. Skipping district OUs.")
    } else if (stateOUIds["MH_DSE"]) {
      // Check if parent state OU (MH_DSE) was created
      const districts = [
        { name: "District Education Office - Mumbai", region_code: "MH_MUM_DEO", parent_region_code: "MH_DSE" },
        { name: "District Education Office - Pune", region_code: "MH_PUN_DEO", parent_region_code: "MH_DSE" },
      ]
      const districtOUIds: { [key: string]: string } = {}
      for (const district of districts) {
        const parentId = stateOUIds[district.parent_region_code]
        if (!parentId) {
          console.warn(`Parent OU for ${district.name} (region: ${district.parent_region_code}) not found. Skipping.`)
          continue
        }
        const ouId = await insertOU(
          {
            name: district.name,
            tier_id: districtTierId,
            parent_ou_id: parentId,
            region_code: district.region_code,
          },
          "region_code",
        )
        if (ouId) districtOUIds[district.region_code] = ouId
      }

      // --- Seed Block Level OUs (Example for Pune District) ---
      const blockTierId = getTierId("Block Level")
      if (!blockTierId) {
        console.error("Block Level tier not found. Skipping block OUs.")
      } else if (districtOUIds["MH_PUN_DEO"]) {
        // Check if parent district OU (MH_PUN_DEO) was created
        const blocks = [
          { name: "Block Resource Centre - Haveli", region_code: "MH_PUN_HVL_BRC", parent_region_code: "MH_PUN_DEO" },
          { name: "Block Resource Centre - Mulshi", region_code: "MH_PUN_MUL_BRC", parent_region_code: "MH_PUN_DEO" },
        ]
        const blockOUIds: { [key: string]: string } = {}
        for (const block of blocks) {
          const parentId = districtOUIds[block.parent_region_code]
          if (!parentId) {
            console.warn(`Parent OU for ${block.name} (region: ${block.parent_region_code}) not found. Skipping.`)
            continue
          }
          const ouId = await insertOU(
            {
              name: block.name,
              tier_id: blockTierId,
              parent_ou_id: parentId,
              region_code: block.region_code,
            },
            "region_code",
          )
          if (ouId) blockOUIds[block.region_code] = ouId
        }
        // --- Seed Cluster Level OUs (Example for Haveli Block) ---
        const clusterTierId = getTierId("Cluster Level")
        if (!clusterTierId) {
          console.error("Cluster Level tier not found. Skipping cluster OUs.")
        } else if (blockOUIds["MH_PUN_HVL_BRC"]) {
          const clusters = [
            {
              name: "Cluster Resource Centre - Wagholi",
              region_code: "MH_PUN_HVL_WAG_CRC",
              parent_region_code: "MH_PUN_HVL_BRC",
            },
          ]
          for (const cluster of clusters) {
            const parentId = blockOUIds[cluster.parent_region_code]
            if (!parentId) {
              console.warn(`Parent OU for ${cluster.name} (region: ${cluster.parent_region_code}) not found. Skipping.`)
              continue
            }
            await insertOU(
              {
                name: cluster.name,
                tier_id: clusterTierId,
                parent_ou_id: parentId,
                region_code: cluster.region_code,
              },
              "region_code",
            )
          }
        }
      }
    }
  }

  // --- Seed Institutional Level OUs (Schools) ---
  const institutionalTierId = getTierId("Institutional Level (Schools)")
  if (!institutionalTierId) {
    console.error("Institutional Level tier not found. Skipping school OUs.")
  } else {
    // Example: KVS Schools under KVS HQ (or a regional KVS office if modeled)
    const kvsHqId = centralOUIds["IND_KVS_HQ"]
    if (kvsHqId) {
      await insertOU({
        name: "Kendriya Vidyalaya - Andrews Ganj, Delhi",
        tier_id: institutionalTierId,
        parent_ou_id: kvsHqId,
        region_code: "KVS_DEL_ANDगंज",
      })
      await insertOU({
        name: "Kendriya Vidyalaya - IIT Powai, Mumbai",
        tier_id: institutionalTierId,
        parent_ou_id: kvsHqId,
        region_code: "KVS_MUM_IIT",
      })
    }

    // Example: NVS Schools under NVS HQ
    const nvsHqId = centralOUIds["IND_NVS_HQ"]
    if (nvsHqId) {
      await insertOU({
        name: "Jawahar Navodaya Vidyalaya - Pune",
        tier_id: institutionalTierId,
        parent_ou_id: nvsHqId,
        region_code: "NVS_PUN",
      })
    }

    // Example: Government Schools under a District Education Office (e.g., Pune DEO)
    const puneDeoId = (
      await supabaseAdmin.from("organizational_units").select("id").eq("region_code", "MH_PUN_DEO").single()
    ).data?.id
    if (puneDeoId) {
      await insertOU({
        name: "ZP School - Model Colony, Pune",
        tier_id: institutionalTierId,
        parent_ou_id: puneDeoId,
        region_code: "MH_PUN_GOV_MOD",
      })
      await insertOU({
        name: "Govt High School - Aundh, Pune",
        tier_id: institutionalTierId,
        parent_ou_id: puneDeoId,
        region_code: "MH_PUN_GOV_AUN",
      })
    }

    // Example: Private Schools (could be under a "Private School Trust" OU, or directly under a regional/district for oversight)
    // For simplicity, let's assume a generic "Private Schools Management - Maharashtra" OU at State Level if needed, or they are independent.
    // Or, they could be parented by a district office for regulatory purposes.
    // For this example, let's make them independent at the institutional level for now, or parented by Pune DEO for oversight.
    if (puneDeoId) {
      await insertOU({
        name: "Delhi Public School - Pune",
        tier_id: institutionalTierId,
        parent_ou_id: puneDeoId,
        region_code: "PVT_PUN_DPS",
        metadata: { type: "Private Unaided" },
      })
    } else {
      // Fallback if Pune DEO not found, make it unparented or parented by state DSE
      const mhDseId = (
        await supabaseAdmin.from("organizational_units").select("id").eq("region_code", "MH_DSE").single()
      ).data?.id
      await insertOU({
        name: "Delhi Public School - Pune",
        tier_id: institutionalTierId,
        parent_ou_id: mhDseId,
        region_code: "PVT_PUN_DPS",
        metadata: { type: "Private Unaided" },
      })
    }
  }
  console.log("Finished seeding hierarchical organizational units.")
}

seedHierarchicalOrganizationalUnits()
  .then(() => console.log("Organizational Unit seeding script completed successfully."))
  .catch((err) => console.error("Error in Organizational Unit seeding script:", err))
