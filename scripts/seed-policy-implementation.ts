// Define an interface for the implementation status data
interface PolicyImplementationStatus {
  policy_id: string
  region_type: "National" | "State" | "District" | "Block" | "School_Level"
  region_code?: string
  region_name: string
  overall_status:
    | "Not Started"
    | "Planning"
    | "In Progress"
    | "Partially Implemented"
    | "Fully Implemented"
    | "Delayed"
    | "On Hold"
    | "Cancelled"
  progress_percentage: number
  target_completion_date?: string
  actual_completion_date?: string
  key_indicators?: Record<string, any>
  summary_notes?: string
  last_updated_by?: string
}

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

const getRandomDateInRange = (start: Date, end: Date): string => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split("T")[0]
}

const generateSeedPolicyImplementationData = (
  policyIds: string[],
  countPerPolicy = 5,
): PolicyImplementationStatus[] => {
  const implementationData: PolicyImplementationStatus[] = []
  const regionTypes: PolicyImplementationStatus["region_type"][] = ["State", "District", "Block"]
  const overallStatuses: PolicyImplementationStatus["overall_status"][] = [
    "Not Started",
    "Planning",
    "In Progress",
    "Partially Implemented",
    "Fully Implemented",
    "Delayed",
    "On Hold",
  ]
  const states = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ]

  const startDate = new Date(2023, 0, 1)
  const endDate = new Date(2025, 11, 31)

  for (const policyId of policyIds) {
    // Add a national level entry for each policy
    implementationData.push({
      policy_id: policyId,
      region_type: "National",
      region_name: "India",
      region_code: "IND",
      overall_status: getRandomElement(overallStatuses),
      progress_percentage: Math.floor(Math.random() * 101),
      target_completion_date: getRandomDateInRange(new Date(), endDate),
      key_indicators: { national_target_metric: Math.floor(Math.random() * 1000) },
      summary_notes: `National level implementation overview for policy ${policyId}.`,
      last_updated_by: "SystemSeed",
    })

    for (let i = 0; i < countPerPolicy; i++) {
      const regionType = getRandomElement(regionTypes)
      let regionName = ""
      let regionCode: string | undefined

      switch (regionType) {
        case "State":
          regionName = getRandomElement(states)
          regionCode = `ST-${regionName.substring(0, 3).toUpperCase()}`
          break
        case "District":
          regionName = `District ${String.fromCharCode(65 + (i % 26))}` // District A, B, ...
          regionCode = `DT-${regionName.substring(0, 3).toUpperCase()}${i}`
          break
        case "Block":
          regionName = `Block ${i + 1}`
          regionCode = `BLK-${i + 1}`
          break
        default:
          regionName = "Unknown Region"
      }

      const status = getRandomElement(overallStatuses)
      const progress =
        status === "Fully Implemented" ? 100 : status === "Not Started" ? 0 : Math.floor(Math.random() * 80) + 10 // 10-90 for others

      const targetDate = getRandomDateInRange(new Date(), endDate)
      let actualDate: string | undefined
      if (status === "Fully Implemented") {
        actualDate = getRandomDateInRange(startDate, new Date()) // Completed in the past
      }

      implementationData.push({
        policy_id: policyId,
        region_type: regionType,
        region_name: regionName,
        region_code: regionCode,
        overall_status: status,
        progress_percentage: progress,
        target_completion_date: targetDate,
        actual_completion_date: actualDate,
        key_indicators: {
          [`${regionType.toLowerCase()}_metric_1`]: Math.floor(Math.random() * 500),
          [`${regionType.toLowerCase()}_metric_2`]: Math.random() > 0.5,
        },
        summary_notes: `Implementation notes for ${policyId} in ${regionName}.`,
        last_updated_by: "SystemSeed",
      })
    }
  }
  return implementationData
}

// Main execution for the script
try {
  // In a real scenario, you'd fetch existing policy IDs from the database.
  // For this script, we'll use placeholder IDs.
  // Assume `seedPoliciesAction` has been run and created policies.
  // For v0, we can't directly query the DB here, so we'll use a few illustrative IDs.
  // If you run this after seeding policies, you can manually get some IDs from your DB.
  const placeholderPolicyIds = [
    "POL-2024-ABCD", // Replace with actual IDs after running seed-policies.ts
    "POL-2024-EFGH",
    "POL-2023-IJKL",
    "POL-2023-MNOP",
    "POL-2024-QRST",
  ]

  // If you have a way to get actual policy IDs (e.g., from the output of seed-policies.ts or by querying Supabase directly)
  // you should use those. For now, we'll generate based on placeholders.
  // If no policy IDs are provided, it will generate an empty array.
  const seededImplementations = generateSeedPolicyImplementationData(placeholderPolicyIds, 5) // 5 implementation entries per policy

  console.log(`Generated ${seededImplementations.length} policy implementation status entries.`)
  console.log("---IMPLEMENTATION_SEED_DATA_START---")
  console.log(JSON.stringify(seededImplementations, null, 2))
  console.log("---IMPLEMENTATION_SEED_DATA_END---")
} catch (error) {
  console.error("Error generating policy implementation seed data:", error)
}

export { generateSeedPolicyImplementationData }
