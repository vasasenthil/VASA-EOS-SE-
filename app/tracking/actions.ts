"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function getSupabase() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createServerClient(url, key, {
    cookies: { get: (name) => cookieStore.get(name)?.value },
  })
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type ChallengeRow = {
  id: string
  title: string
  category: string
  severity: string
  status: string
  state: string
  owner: string
  raised_on: string
  resolution_target: string
  description?: string
}

export type StakeholderRow = {
  id: string
  name: string
  type: string
  role: string
  state: string
  engagement_level: string
  last_contact: string
  email?: string
  phone?: string
}

export type ReportRow = {
  id: string
  title: string
  category: string
  generated_on: string
  status: string
  format: string
}

// ── Server Actions ─────────────────────────────────────────────────────────────

export async function getChallengesData(): Promise<ChallengeRow[]> {
  try {
    const supabase = await getSupabase()
    if (!supabase) return []
    const { data } = await supabase
      .from("challenges")
      .select("*")
      .order("raised_on", { ascending: false })
      .limit(100)
    return (data as ChallengeRow[]) ?? []
  } catch {
    return []
  }
}

export async function getStakeholdersData(): Promise<StakeholderRow[]> {
  try {
    const supabase = await getSupabase()
    if (!supabase) return []
    const { data } = await supabase
      .from("stakeholders")
      .select("*")
      .order("name", { ascending: true })
      .limit(200)
    return (data as StakeholderRow[]) ?? []
  } catch {
    return []
  }
}

export async function getReportsData(): Promise<ReportRow[]> {
  try {
    const supabase = await getSupabase()
    if (!supabase) return []
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("generated_on", { ascending: false })
      .limit(50)
    return (data as ReportRow[]) ?? []
  } catch {
    return []
  }
}
