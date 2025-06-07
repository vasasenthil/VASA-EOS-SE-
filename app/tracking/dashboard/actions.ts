"use server"

import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ImplementationChallenge, ImplementationChallengeInput } from "../challenges/types"
import type { ImplementationStakeholder, ImplementationStakeholderInput } from "../stakeholders/types"
import type { ImplementationMilestone, ImplementationMilestoneInput } from "../milestones/types"
import type { PolicyImplementationStatus } from "./actions" // Self-reference for type

// Import data generation functions
import { generateSeedPolicyImplementationData } from "@/scripts/seed-policy-implementation"
import { generateSampleMilestones } from "@/scripts/seed-milestones"
import { generateSampleChallenges } from "@/scripts/seed-challenges"
import { generateSeedStakeholderData } from "@/scripts/seed-stakeholders"

// Define interfaces for the data we'll return
export interface TrackerStat {
  title: string
  value: string
  description?: string
}

export interface PolicyProgressItem {
  id: string // policy_id
  title: string
  status: string // overall_status from national level or aggregated
  progress: number // progress_percentage from national level or aggregated
  statesAffected: number
  lastUpdate: string // updated_at from policy_implementation_status
  implementation_status_id: string
}

export interface NepThrustAreaProgress {
  name: string
  value: number
}

export interface TrackerDashboardData {
  stats: TrackerStat[]
  policyProgress: PolicyProgressItem[]
  nepThrustAreaProgress: NepThrustAreaProgress[]
  error?: string
}

export interface ImplementationMilestoneSeed extends ImplementationMilestoneInput {} // Alias for clarity if needed

export interface PolicyImplementationStatusDetail extends PolicyImplementationStatus {
  policy_title?: string
}

const CRITICAL_DB_ERROR_MSG =
  "Database client is not initialized. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are correctly set in your Vercel project."

export async function getTrackerDashboardData(): Promise<TrackerDashboardData> {
  if (!isSupabaseAdminConfigured()) {
    console.warn("getTrackerDashboardData: Supabase admin client not configured.")
    return {
      stats: [],
      policyProgress: [],
      nepThrustAreaProgress: [],
      error: CRITICAL_DB_ERROR_MSG,
    }
  }

  try {
    const [implementationResult, challengesResult, stakeholdersResult] = await Promise.all([
      supabaseAdmin!.from("policy_implementation_status").select(
        `
    id, 
    policy_id,
    region_type,
    region_name,
    overall_status,
    progress_percentage,
    updated_at,
    policies (
      title,
      nep_thrust_areas
    )
  `,
      ),
      supabaseAdmin!.from("implementation_challenges").select("id, severity, status, reported_date, resolved_date"),
      supabaseAdmin!.from("implementation_stakeholders").select("id, stakeholder_name, stakeholder_type"),
    ])

    const { data: implementationData, error: implementationError } = implementationResult
    const { data: challengesData, error: challengesError } = challengesResult
    const { data: stakeholdersData, error: stakeholdersError } = stakeholdersResult

    if (implementationError) {
      throw implementationError
    }
    if (challengesError) {
      console.error("Error fetching challenges data:", challengesError)
    }
    if (stakeholdersError) {
      console.error("Error fetching stakeholders data:", stakeholdersError)
    }

    if (!implementationData) {
      return {
        stats: [],
        policyProgress: [],
        nepThrustAreaProgress: [],
        error: "No implementation data found.",
      }
    }

    // --- Stats and Policy Progress Calculation (remains the same) ---
    const trackedPolicyIds = new Set(implementationData.map((item) => item.policy_id))
    const totalPoliciesTracked = trackedPolicyIds.size
    const totalProgress = implementationData.reduce((acc, item) => acc + (item.progress_percentage || 0), 0)
    const avgImplementationRate =
      implementationData.length > 0 ? Math.round(totalProgress / implementationData.length) : 0
    const activeImplementations = implementationData.filter((item) => item.overall_status === "In Progress").length
    const statesCovered = new Set(
      implementationData.filter((item) => item.region_type === "State").map((item) => item.region_name),
    ).size
    let totalOpenChallenges = 0
    let criticalHighChallenges = 0
    let resolvedChallenges = 0
    if (challengesData) {
      totalOpenChallenges = challengesData.filter(
        (c) => c.status === "Open" || c.status === "In Progress" || c.status === "Escalated",
      ).length
      criticalHighChallenges = challengesData.filter((c) => c.severity === "Critical" || c.severity === "High").length
      resolvedChallenges = challengesData.filter((c) => c.status === "Resolved" || c.status === "Closed").length
    }
    let totalStakeholders = 0
    let uniqueStakeholderTypes = 0
    if (stakeholdersData) {
      totalStakeholders = stakeholdersData.length
      const types = new Set(stakeholdersData.map((s) => s.stakeholder_type).filter(Boolean))
      uniqueStakeholderTypes = types.size
    }
    const stats: TrackerStat[] = [
      {
        title: "Total Policies Tracked",
        value: totalPoliciesTracked.toString(),
        description: "Unique policies with tracking data",
      },
      { title: "Avg. Implementation Rate", value: `${avgImplementationRate}%`, description: "Across all regions" },
      {
        title: "Active Implementations",
        value: activeImplementations.toString(),
        description: "Currently 'In Progress'",
      },
      { title: "States Covered", value: `${statesCovered}`, description: "Unique states with implementation data" },
      {
        title: "Open Challenges",
        value: totalOpenChallenges.toString(),
        description: "Active issues needing attention",
      },
      {
        title: "Critical/High Challenges",
        value: criticalHighChallenges.toString(),
        description: "High-priority issues",
      },
      {
        title: "Resolved Challenges",
        value: resolvedChallenges.toString(),
        description: "Challenges successfully addressed",
      },
      {
        title: "Total Stakeholders Mapped",
        value: totalStakeholders.toString(),
        description: "Across all implementations",
      },
      {
        title: "Unique Stakeholder Types",
        value: uniqueStakeholderTypes.toString(),
        description: "Different categories of stakeholders",
      },
    ]
    const progressMap = new Map<string, PolicyProgressItem>()
    for (const item of implementationData) {
      if (!progressMap.has(item.policy_id)) {
        progressMap.set(item.policy_id, {
          id: item.policy_id,
          // @ts-ignore
          title: item.policies?.title || "Unknown Policy",
          status: "N/A",
          progress: 0,
          statesAffected: 0,
          lastUpdate: item.updated_at,
          implementation_status_id: item.id,
        })
      }
      const policyEntry = progressMap.get(item.policy_id)!
      if (item.region_type === "National") {
        policyEntry.status = item.overall_status
        policyEntry.progress = item.progress_percentage
        policyEntry.implementation_status_id = item.id
      }
      if (item.region_type === "State") {
        policyEntry.statesAffected += 1
      }
      if (new Date(item.updated_at) > new Date(policyEntry.lastUpdate)) {
        policyEntry.lastUpdate = item.updated_at
      }
    }
    for (const policyEntry of progressMap.values()) {
      if (!policyEntry.implementation_status_id) {
        const relatedImplementations = implementationData.filter((impl) => impl.policy_id === policyEntry.id)
        if (relatedImplementations.length > 0) {
          policyEntry.implementation_status_id = relatedImplementations[0].id
        }
      }
    }
    for (const [policyId, policyEntry] of progressMap.entries()) {
      if (policyEntry.status === "N/A") {
        const policyRegions = implementationData.filter((i) => i.policy_id === policyId)
        if (policyRegions.length > 0) {
          const highestProgressRegion = policyRegions.reduce(
            (max, current) => (current.progress_percentage > max.progress_percentage ? current : max),
            policyRegions[0],
          )
          policyEntry.status = highestProgressRegion.overall_status
          policyEntry.progress = highestProgressRegion.progress_percentage
          if (policyEntry.implementation_status_id === progressMap.get(policyId)?.implementation_status_id) {
            policyEntry.implementation_status_id = highestProgressRegion.id
          }
        }
      }
    }
    const policyProgress: PolicyProgressItem[] = Array.from(progressMap.values())
      .sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime())
      .slice(0, 10)

    // --- NEP Thrust Area Progress Calculation ---
    const thrustAreaProgressMap = new Map<string, { totalProgress: number; count: number }>()

    for (const item of implementationData) {
      // @ts-ignore
      const thrustAreas = item.policies?.nep_thrust_areas
      if (Array.isArray(thrustAreas)) {
        for (const area of thrustAreas) {
          const current = thrustAreaProgressMap.get(area) || { totalProgress: 0, count: 0 }
          current.totalProgress += item.progress_percentage || 0
          current.count += 1
          thrustAreaProgressMap.set(area, current)
        }
      }
    }

    const nepThrustAreaProgress: NepThrustAreaProgress[] = Array.from(thrustAreaProgressMap.entries())
      .map(([name, data]) => ({
        name,
        value: data.count > 0 ? Math.round(data.totalProgress / data.count) : 0,
      }))
      .sort((a, b) => b.value - a.value)

    return {
      stats,
      policyProgress,
      nepThrustAreaProgress,
    }
  } catch (error: any) {
    console.error("Error fetching tracker dashboard data:", error)
    return {
      stats: [],
      policyProgress: [],
      nepThrustAreaProgress: [],
      error: `Failed to fetch dashboard data: ${error.message}`,
    }
  }
}

// ... (rest of the actions file remains the same) ...
export async function seedPolicyImplementationStatusAction(): Promise<{
  message: string
  count: number
  error?: string
}> {
  if (!isSupabaseAdminConfigured()) {
    return { message: CRITICAL_DB_ERROR_MSG, count: 0, error: CRITICAL_DB_ERROR_MSG }
  }
  try {
    const { data: policies, error: policyError } = await supabaseAdmin!.from("policies").select("id").limit(10) // Fetch up to 10 policy IDs to seed for

    if (policyError) throw policyError
    if (!policies || policies.length === 0) {
      return { message: "No policies found to seed implementation status for. Seed policies first.", count: 0 }
    }
    const policyIds = policies.map((p) => p.id)
    const implementationStatusData = generateSeedPolicyImplementationData(policyIds)

    if (!implementationStatusData || implementationStatusData.length === 0) {
      return { message: "No policy implementation status data generated.", count: 0 }
    }

    await supabaseAdmin!.from("policy_implementation_status").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    const { data, error } = await supabaseAdmin!
      .from("policy_implementation_status")
      .insert(implementationStatusData as any[])
      .select()

    if (error) throw error
    const seededCount = data ? data.length : 0
    revalidatePath("/tracking/dashboard")
    return { message: `${seededCount} policy implementation status entries seeded.`, count: seededCount }
  } catch (error: any) {
    console.error("Error in seedPolicyImplementationStatusAction:", error)
    return { message: `Failed to seed: ${error.message}`, count: 0, error: error.message }
  }
}

export async function seedImplementationMilestonesAction(): Promise<{
  message: string
  count: number
  error?: string
}> {
  if (!isSupabaseAdminConfigured()) {
    return { message: CRITICAL_DB_ERROR_MSG, count: 0, error: CRITICAL_DB_ERROR_MSG }
  }
  try {
    const { data: implStatuses, error: implStatusError } = await supabaseAdmin!
      .from("policy_implementation_status")
      .select("id")
      .limit(10)

    if (implStatusError) throw implStatusError
    if (!implStatuses || implStatuses.length === 0) {
      return { message: "No implementation statuses found. Seed them first.", count: 0 }
    }
    const implStatusIds = implStatuses.map((s) => s.id)
    const milestonesData = generateSampleMilestones(implStatusIds, 3) // Generate 3 milestones per status

    if (!milestonesData || milestonesData.length === 0) {
      return { message: "No milestone data generated.", count: 0 }
    }

    await supabaseAdmin!.from("implementation_milestones").delete().in("implementation_status_id", implStatusIds)
    const { data, error } = await supabaseAdmin!.from("implementation_milestones").insert(milestonesData).select()

    if (error) throw error
    const seededCount = data ? data.length : 0
    revalidatePath("/tracking/dashboard")
    implStatusIds.forEach((id) => revalidatePath(`/tracking/implementations/${id}`))
    return { message: `${seededCount} implementation milestones seeded.`, count: seededCount }
  } catch (error: any) {
    console.error("Error in seedImplementationMilestonesAction:", error)
    return { message: `Failed to seed milestones: ${error.message}`, count: 0, error: error.message }
  }
}

export async function seedImplementationChallengesAction(): Promise<{
  message: string
  count: number
  error?: string
}> {
  if (!isSupabaseAdminConfigured()) {
    return { message: CRITICAL_DB_ERROR_MSG, count: 0, error: CRITICAL_DB_ERROR_MSG }
  }
  try {
    const { data: implStatuses, error: implStatusError } = await supabaseAdmin!
      .from("policy_implementation_status")
      .select("id")
      .limit(10)

    if (implStatusError) throw implStatusError
    if (!implStatuses || implStatuses.length === 0) {
      return { message: "No implementation statuses found. Seed them first.", count: 0 }
    }
    const implStatusIds = implStatuses.map((s) => s.id)
    const challengesData = generateSampleChallenges(implStatusIds, 2) // Generate 2 challenges per status

    if (!challengesData || challengesData.length === 0) {
      return { message: "No challenge data generated.", count: 0 }
    }

    await supabaseAdmin!.from("implementation_challenges").delete().in("implementation_status_id", implStatusIds)
    const { data, error } = await supabaseAdmin!.from("implementation_challenges").insert(challengesData).select()

    if (error) throw error
    const seededCount = data ? data.length : 0
    revalidatePath("/tracking/dashboard")
    implStatusIds.forEach((id) => revalidatePath(`/tracking/implementations/${id}`))
    return { message: `${seededCount} implementation challenges seeded.`, count: seededCount }
  } catch (error: any) {
    console.error("Error in seedImplementationChallengesAction:", error)
    return { message: `Failed to seed challenges: ${error.message}`, count: 0, error: error.message }
  }
}

export interface FullStakeholderSeedData extends ImplementationStakeholderInput {
  implementation_status_id: string
}

export async function seedImplementationStakeholdersAction(): Promise<{
  message: string
  count: number
  error?: string
}> {
  if (!isSupabaseAdminConfigured()) {
    return { message: CRITICAL_DB_ERROR_MSG, count: 0, error: CRITICAL_DB_ERROR_MSG }
  }
  try {
    const { data: implStatuses, error: implStatusError } = await supabaseAdmin!
      .from("policy_implementation_status")
      .select("id")
      .limit(10)

    if (implStatusError) throw implStatusError
    if (!implStatuses || implStatuses.length === 0) {
      return { message: "No implementation statuses found. Seed them first.", count: 0 }
    }
    const implStatusIds = implStatuses.map((s) => s.id)
    const stakeholdersData = generateSeedStakeholderData(implStatusIds, 2) // Generate 2 stakeholders per status

    if (!stakeholdersData || stakeholdersData.length === 0) {
      return { message: "No stakeholder data generated.", count: 0 }
    }

    await supabaseAdmin!.from("implementation_stakeholders").delete().in("implementation_status_id", implStatusIds)
    const { data, error } = await supabaseAdmin!.from("implementation_stakeholders").insert(stakeholdersData).select()

    if (error) throw error
    const seededCount = data ? data.length : 0
    revalidatePath("/tracking/dashboard")
    implStatusIds.forEach((id) => revalidatePath(`/tracking/implementations/${id}`))
    return { message: `${seededCount} implementation stakeholders seeded.`, count: seededCount }
  } catch (error: any) {
    console.error("Error in seedImplementationStakeholdersAction:", error)
    return { message: `Failed to seed stakeholders: ${error.message}`, count: 0, error: error.message }
  }
}

// --- CRUD Actions for Implementation Challenges ---
// ... (addChallengeAction, getChallengesByImplementationIdAction, updateChallengeAction, deleteChallengeAction remain the same) ...
export interface ChallengeActionState {
  message: string
  success: boolean
  challengeId?: string
  errors?: Partial<Record<keyof ImplementationChallengeInput | "_general", string>>
}

export async function addChallengeAction(
  implementationStatusId: string,
  challengeData: Omit<ImplementationChallengeInput, "implementation_status_id">,
): Promise<ChallengeActionState> {
  if (!isSupabaseAdminConfigured()) {
    return { message: CRITICAL_DB_ERROR_MSG, success: false, errors: { _general: CRITICAL_DB_ERROR_MSG } }
  }

  const dataToInsert: ImplementationChallengeInput = {
    ...challengeData,
    implementation_status_id: implementationStatusId,
  }

  if (!dataToInsert.challenge_title || dataToInsert.challenge_title.trim().length < 3) {
    return { message: "Validation failed", success: false, errors: { challenge_title: "Title is too short." } }
  }

  const { data, error } = await supabaseAdmin!.from("implementation_challenges").insert(dataToInsert).select().single()

  if (error) {
    console.error("Error adding challenge:", error)
    return { message: `Failed to add challenge: ${error.message}`, success: false, errors: { _general: error.message } }
  }

  revalidatePath(`/tracking/dashboard`)
  revalidatePath(`/tracking/implementations/${implementationStatusId}`)
  return { message: "Challenge added successfully.", success: true, challengeId: data.id }
}

export async function getChallengesByImplementationIdAction(
  implementationStatusId: string,
): Promise<{ challenges: ImplementationChallenge[]; error?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { challenges: [], error: CRITICAL_DB_ERROR_MSG }
  }

  const { data, error } = await supabaseAdmin!
    .from("implementation_challenges")
    .select("*")
    .eq("implementation_status_id", implementationStatusId)
    .order("reported_date", { ascending: false })

  if (error) {
    console.error("Error fetching challenges:", error)
    return { challenges: [], error: error.message }
  }
  return { challenges: data || [] }
}

export async function updateChallengeAction(
  challengeId: string,
  challengeData: Partial<Omit<ImplementationChallengeInput, "implementation_status_id">>,
): Promise<ChallengeActionState> {
  if (!isSupabaseAdminConfigured()) {
    return { message: CRITICAL_DB_ERROR_MSG, success: false, errors: { _general: CRITICAL_DB_ERROR_MSG } }
  }

  if (challengeData.challenge_title && challengeData.challenge_title.trim().length < 3) {
    return { message: "Validation failed", success: false, errors: { challenge_title: "Title is too short." } }
  }

  const { data, error } = await supabaseAdmin!
    .from("implementation_challenges")
    .update(challengeData)
    .eq("id", challengeId)
    .select()
    .single()

  if (error) {
    console.error("Error updating challenge:", error)
    return {
      message: `Failed to update challenge: ${error.message}`,
      success: false,
      errors: { _general: error.message },
    }
  }

  revalidatePath(`/tracking/dashboard`)
  if (data?.implementation_status_id) {
    revalidatePath(`/tracking/implementations/${data.implementation_status_id}`)
  }
  return { message: "Challenge updated successfully.", success: true, challengeId: data.id }
}

export async function deleteChallengeAction(challengeId: string): Promise<ChallengeActionState> {
  if (!isSupabaseAdminConfigured()) {
    return { message: CRITICAL_DB_ERROR_MSG, success: false }
  }

  const { data: challengeToDelete, error: fetchError } = await supabaseAdmin!
    .from("implementation_challenges")
    .select("implementation_status_id")
    .eq("id", challengeId)
    .single()

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error fetching challenge before delete:", fetchError)
  }

  const { error } = await supabaseAdmin!.from("implementation_challenges").delete().eq("id", challengeId)

  if (error) {
    console.error("Error deleting challenge:", error)
    return { message: `Failed to delete challenge: ${error.message}`, success: false }
  }

  revalidatePath(`/tracking/dashboard`)
  if (challengeToDelete?.implementation_status_id) {
    revalidatePath(`/tracking/implementations/${challengeToDelete.implementation_status_id}`)
  }
  return { message: "Challenge deleted successfully.", success: true, challengeId }
}

// --- getImplementationStatusByIdAction ---
// ... (remains the same) ...
export async function getImplementationStatusByIdAction(
  implementationStatusId: string,
): Promise<{ implementationStatus: PolicyImplementationStatusDetail | null; error?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { implementationStatus: null, error: CRITICAL_DB_ERROR_MSG }
  }

  const { data, error } = await supabaseAdmin!
    .from("policy_implementation_status")
    .select(
      `
*,
policies (
  title
)
`,
    )
    .eq("id", implementationStatusId)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return { implementationStatus: null, error: "Implementation status not found." }
    }
    console.error("Error fetching implementation status by ID:", error)
    return { implementationStatus: null, error: error.message }
  }

  if (!data) {
    return { implementationStatus: null, error: "Implementation status not found." }
  }

  const implementationStatusDetail: PolicyImplementationStatusDetail = {
    ...data,
    // @ts-ignore
    policy_title: data.policies?.title || "Unknown Policy",
    id: data.id,
    policy_id: data.policy_id,
    region_type: data.region_type,
    region_code: data.region_code,
    region_name: data.region_name,
    overall_status: data.overall_status,
    progress_percentage: data.progress_percentage,
    target_completion_date: data.target_completion_date,
    actual_completion_date: data.actual_completion_date,
    key_indicators: data.key_indicators,
    summary_notes: data.summary_notes,
    last_updated_by: data.last_updated_by,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }

  return { implementationStatus: implementationStatusDetail }
}

// --- CRUD Actions for Implementation Stakeholders ---
// ... (getStakeholdersByImplementationIdAction, addStakeholderAction, updateStakeholderAction, deleteStakeholderAction remain the same) ...
export interface StakeholderActionState {
  message: string
  success: boolean
  stakeholderId?: string
  errors?: Partial<Record<keyof ImplementationStakeholderInput | "_general", string>>
}

export async function getStakeholdersByImplementationIdAction(
  implementationStatusId: string,
): Promise<{ stakeholders: ImplementationStakeholder[]; error?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { stakeholders: [], error: CRITICAL_DB_ERROR_MSG }
  }

  const { data, error } = await supabaseAdmin!
    .from("implementation_stakeholders")
    .select("*")
    .eq("implementation_status_id", implementationStatusId)
    .order("stakeholder_name", { ascending: true })

  if (error) {
    console.error("Error fetching stakeholders:", error)
    return { stakeholders: [], error: error.message }
  }
  return { stakeholders: data || [] }
}

export async function addStakeholderAction(
  implementationStatusId: string,
  stakeholderData: Omit<ImplementationStakeholderInput, "implementation_status_id">,
): Promise<StakeholderActionState> {
  if (!isSupabaseAdminConfigured()) {
    return { message: CRITICAL_DB_ERROR_MSG, success: false, errors: { _general: CRITICAL_DB_ERROR_MSG } }
  }

  const dataToInsert: ImplementationStakeholderInput = {
    ...stakeholderData,
    implementation_status_id: implementationStatusId,
  }

  if (!dataToInsert.stakeholder_name || dataToInsert.stakeholder_name.trim().length < 3) {
    return { message: "Validation failed", success: false, errors: { stakeholder_name: "Name is too short." } }
  }

  const { data, error } = await supabaseAdmin!
    .from("implementation_stakeholders")
    .insert(dataToInsert)
    .select()
    .single()

  if (error) {
    console.error("Error adding stakeholder:", error)
    return {
      message: `Failed to add stakeholder: ${error.message}`,
      success: false,
      errors: { _general: error.message },
    }
  }

  revalidatePath(`/tracking/implementations/${implementationStatusId}`)
  revalidatePath(`/tracking/dashboard`)
  return { message: "Stakeholder added successfully.", success: true, stakeholderId: data.id }
}

export async function updateStakeholderAction(
  stakeholderId: string,
  stakeholderData: Partial<Omit<ImplementationStakeholderInput, "implementation_status_id">>,
): Promise<StakeholderActionState> {
  if (!isSupabaseAdminConfigured()) {
    return { message: CRITICAL_DB_ERROR_MSG, success: false, errors: { _general: CRITICAL_DB_ERROR_MSG } }
  }

  if (stakeholderData.stakeholder_name && stakeholderData.stakeholder_name.trim().length < 3) {
    return { message: "Validation failed", success: false, errors: { stakeholder_name: "Name is too short." } }
  }

  const { data, error } = await supabaseAdmin!
    .from("implementation_stakeholders")
    .update(stakeholderData)
    .eq("id", stakeholderId)
    .select()
    .single()

  if (error) {
    console.error("Error updating stakeholder:", error)
    return {
      message: `Failed to update stakeholder: ${error.message}`,
      success: false,
      errors: { _general: error.message },
    }
  }

  if (data?.implementation_status_id) {
    revalidatePath(`/tracking/implementations/${data.implementation_status_id}`)
  }
  revalidatePath(`/tracking/dashboard`)
  return { message: "Stakeholder updated successfully.", success: true, stakeholderId: data.id }
}

export async function deleteStakeholderAction(stakeholderId: string): Promise<StakeholderActionState> {
  if (!isSupabaseAdminConfigured()) {
    return { message: CRITICAL_DB_ERROR_MSG, success: false }
  }

  const { data: stakeholderToDelete, error: fetchError } = await supabaseAdmin!
    .from("implementation_stakeholders")
    .select("implementation_status_id")
    .eq("id", stakeholderId)
    .single()

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error fetching stakeholder before delete:", fetchError)
  }

  const { error } = await supabaseAdmin!.from("implementation_stakeholders").delete().eq("id", stakeholderId)

  if (error) {
    console.error("Error deleting stakeholder:", error)
    return { message: `Failed to delete stakeholder: ${error.message}`, success: false }
  }

  if (stakeholderToDelete?.implementation_status_id) {
    revalidatePath(`/tracking/implementations/${stakeholderToDelete.implementation_status_id}`)
  }
  revalidatePath(`/tracking/dashboard`)
  return { message: "Stakeholder deleted successfully.", success: true, stakeholderId }
}

// --- CRUD Actions for Implementation Milestones ---
// ... (getMilestonesByImplementationIdAction, addMilestoneAction, updateMilestoneAction, deleteMilestoneAction remain the same) ...
export interface MilestoneActionState {
  message: string
  success: boolean
  milestoneId?: string
  errors?: Partial<Record<keyof ImplementationMilestoneInput | "_general", string>>
}

export async function getMilestonesByImplementationIdAction(
  implementationStatusId: string,
): Promise<{ milestones: ImplementationMilestone[]; error?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { milestones: [], error: CRITICAL_DB_ERROR_MSG }
  }

  const { data, error } = await supabaseAdmin!
    .from("implementation_milestones")
    .select("*")
    .eq("implementation_status_id", implementationStatusId)
    .order("target_date", { ascending: true, nullsFirst: false })

  if (error) {
    console.error("Error fetching milestones:", error)
    return { milestones: [], error: error.message }
  }
  return { milestones: data || [] }
}

export async function addMilestoneAction(
  implementationStatusId: string,
  milestoneData: Omit<ImplementationMilestoneInput, "implementation_status_id">,
): Promise<MilestoneActionState> {
  if (!isSupabaseAdminConfigured()) {
    return { message: CRITICAL_DB_ERROR_MSG, success: false, errors: { _general: CRITICAL_DB_ERROR_MSG } }
  }

  const dataToInsert: ImplementationMilestoneInput = {
    ...milestoneData,
    implementation_status_id: implementationStatusId,
  }

  if (!dataToInsert.milestone_name || dataToInsert.milestone_name.trim().length < 3) {
    return { message: "Validation failed", success: false, errors: { milestone_name: "Name is too short." } }
  }

  const { data, error } = await supabaseAdmin!.from("implementation_milestones").insert(dataToInsert).select().single()

  if (error) {
    console.error("Error adding milestone:", error)
    return {
      message: `Failed to add milestone: ${error.message}`,
      success: false,
      errors: { _general: error.message },
    }
  }

  revalidatePath(`/tracking/implementations/${implementationStatusId}`)
  return { message: "Milestone added successfully.", success: true, milestoneId: data.id }
}

export async function updateMilestoneAction(
  milestoneId: string,
  milestoneData: Partial<Omit<ImplementationMilestoneInput, "implementation_status_id">>,
): Promise<MilestoneActionState> {
  if (!isSupabaseAdminConfigured()) {
    return { message: CRITICAL_DB_ERROR_MSG, success: false, errors: { _general: CRITICAL_DB_ERROR_MSG } }
  }

  if (milestoneData.milestone_name && milestoneData.milestone_name.trim().length < 3) {
    return { message: "Validation failed", success: false, errors: { milestone_name: "Name is too short." } }
  }

  const { data, error } = await supabaseAdmin!
    .from("implementation_milestones")
    .update(milestoneData)
    .eq("id", milestoneId)
    .select()
    .single()

  if (error) {
    console.error("Error updating milestone:", error)
    return {
      message: `Failed to update milestone: ${error.message}`,
      success: false,
      errors: { _general: error.message },
    }
  }

  if (data?.implementation_status_id) {
    revalidatePath(`/tracking/implementations/${data.implementation_status_id}`)
  }
  return { message: "Milestone updated successfully.", success: true, milestoneId: data.id }
}

export async function deleteMilestoneAction(milestoneId: string): Promise<MilestoneActionState> {
  if (!isSupabaseAdminConfigured()) {
    return { message: CRITICAL_DB_ERROR_MSG, success: false }
  }

  const { data: milestoneToDelete, error: fetchError } = await supabaseAdmin!
    .from("implementation_milestones")
    .select("implementation_status_id")
    .eq("id", milestoneId)
    .single()

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error fetching milestone before delete:", fetchError)
  }

  const { error } = await supabaseAdmin!.from("implementation_milestones").delete().eq("id", milestoneId)

  if (error) {
    console.error("Error deleting milestone:", error)
    return { message: `Failed to delete milestone: ${error.message}`, success: false }
  }

  if (milestoneToDelete?.implementation_status_id) {
    revalidatePath(`/tracking/implementations/${milestoneToDelete.implementation_status_id}`)
  }
  return { message: "Milestone deleted successfully.", success: true, milestoneId }
}
