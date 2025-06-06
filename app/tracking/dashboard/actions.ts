"use server"

import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server"

// Define interfaces for the data we'll return
export interface TrackerStat {
  title: string
  value: string
  description?: string
}

export interface PolicyProgressItem {
  id: string
  title: string
  status: string
  progress: number
  statesAffected: number
  lastUpdate: string
}

export interface TrackerDashboardData {
  stats: TrackerStat[]
  policyProgress: PolicyProgressItem[]
  error?: string
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
    // Fetch all implementation statuses and join with policies to get titles
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

    // --- Calculate Stats ---
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

    // --- Get Policy Progress List ---
    // Group by policy_id to aggregate data
    const progressMap = new Map<string, PolicyProgressItem>()

    for (const item of implementationData) {
      if (!progressMap.has(item.policy_id)) {
        progressMap.set(item.policy_id, {
          id: item.policy_id,
          // @ts-ignore - policies is a joined table
          title: item.policies?.title || "Unknown Policy",
          status: "N/A", // Default, will be overwritten
          progress: 0, // Default, will be overwritten
          statesAffected: 0,
          lastUpdate: item.updated_at,
        })
      }

      const policyEntry = progressMap.get(item.policy_id)!

      // Use National level for overall status and progress if available
      if (item.region_type === "National") {
        policyEntry.status = item.overall_status
        policyEntry.progress = item.progress_percentage
      }

      if (item.region_type === "State") {
        policyEntry.statesAffected += 1
      }

      // Keep the latest update timestamp
      if (new Date(item.updated_at) > new Date(policyEntry.lastUpdate)) {
        policyEntry.lastUpdate = item.updated_at
      }
    }

    // If a policy didn't have a national entry, find the highest progress among its regions
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
      .slice(0, 5) // Get top 5 most recently updated policies

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
