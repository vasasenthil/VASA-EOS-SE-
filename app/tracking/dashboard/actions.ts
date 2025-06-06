"use server"

import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache" // Added revalidatePath

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
}

export interface TrackerDashboardData {
  stats: TrackerStat[]
  policyProgress: PolicyProgressItem[]
  error?: string
}

// Interface for milestone seed data
interface ImplementationMilestoneSeed {
  implementation_status_id: string
  milestone_name: string
  description?: string
  target_date?: string
  actual_completion_date?: string
  status: string
  responsible_entity?: string
  notes?: string
}

const CRITICAL_DB_ERROR_MSG =
  "Database client is not initialized. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are correctly set in your Vercel project."

export async function getTrackerDashboardData(): Promise<TrackerDashboardData> {
  if (!isSupabaseAdminConfigured()) {
    console.warn("getTrackerDashboardData: Supabase admin client not configured.")
    return {
      stats: [],
      policyProgress: [],
      error: CRITICAL_DB_ERROR_MSG,
    }
  }

  try {
    const { data: implementationData, error: implementationError } = await supabaseAdmin!
      .from("policy_implementation_status")
      .select(
        `
        *,
        policies (
          title
        )
      `,
      )

    if (implementationError) {
      throw implementationError
    }

    if (!implementationData) {
      return {
        stats: [],
        policyProgress: [],
        error: "No implementation data found.",
      }
    }

    const trackedPolicyIds = new Set(implementationData.map((item) => item.policy_id))
    const totalPoliciesTracked = trackedPolicyIds.size

    const totalProgress = implementationData.reduce((acc, item) => acc + (item.progress_percentage || 0), 0)
    const avgImplementationRate =
      implementationData.length > 0 ? Math.round(totalProgress / implementationData.length) : 0

    const activeImplementations = implementationData.filter((item) => item.overall_status === "In Progress").length

    const statesCovered = new Set(
      implementationData.filter((item) => item.region_type === "State").map((item) => item.region_name),
    ).size

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
        })
      }

      const policyEntry = progressMap.get(item.policy_id)!
      if (item.region_type === "National") {
        policyEntry.status = item.overall_status
        policyEntry.progress = item.progress_percentage
      }
      if (item.region_type === "State") {
        policyEntry.statesAffected += 1
      }
      if (new Date(item.updated_at) > new Date(policyEntry.lastUpdate)) {
        policyEntry.lastUpdate = item.updated_at
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
        }
      }
    }

    const policyProgress: PolicyProgressItem[] = Array.from(progressMap.values())
      .sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime())
      .slice(0, 5)

    return {
      stats,
      policyProgress,
    }
  } catch (error: any) {
    console.error("Error fetching tracker dashboard data:", error)
    return {
      stats: [],
      policyProgress: [],
      error: `Failed to fetch dashboard data: ${error.message}`,
    }
  }
}

export async function seedImplementationMilestonesAction(
  milestonesData: ImplementationMilestoneSeed[],
): Promise<{ message: string; count: number; error?: string }> {
  if (!isSupabaseAdminConfigured()) {
    console.warn("seedImplementationMilestonesAction: Supabase admin client not configured.")
    return { message: CRITICAL_DB_ERROR_MSG, count: 0, error: CRITICAL_DB_ERROR_MSG }
  }

  if (!milestonesData || milestonesData.length === 0) {
    return { message: "No milestone data provided to seed.", count: 0 }
  }

  // Optional: Clear existing milestone data for the provided implementation_status_ids to avoid duplicates
  const implementationStatusIdsToClear = [...new Set(milestonesData.map((item) => item.implementation_status_id))]
  if (implementationStatusIdsToClear.length > 0) {
    const { error: deleteError } = await supabaseAdmin!
      .from("implementation_milestones")
      .delete()
      .in("implementation_status_id", implementationStatusIdsToClear)

    if (deleteError) {
      console.warn("Supabase error clearing existing milestone data:", deleteError.message)
      // Not returning error here, just a warning, will proceed with insert
    }
  }

  const { data, error } = await supabaseAdmin!.from("implementation_milestones").insert(milestonesData).select()

  if (error) {
    console.error("Supabase error seeding implementation milestones:", error)
    return {
      message: `Failed to seed implementation milestones. Error: ${error.message}`,
      count: 0,
      error: error.message,
    }
  }

  const seededCount = data ? data.length : 0
  revalidatePath("/tracking/dashboard") // Revalidate if milestones are shown on dashboard
  return { message: `${seededCount} implementation milestones seeded successfully.`, count: seededCount }
}
