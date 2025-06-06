"use server"

// Ensure this import is EXACTLY as follows and does NOT include getSupabaseInitializationError
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server"
import type { PolicyDraft } from "./policy-form-constants"
import { revalidatePath } from "next/cache"

export interface SubmitPolicyActionState {
  message: string
  success: boolean
  policyId?: string
  errors?: Partial<Record<keyof PolicyDraft | "_general", string>>
}

export interface DeletePolicyActionState {
  message: string
  success: boolean
  deletedPolicyId?: string
}

// This is a static string. No function is called here.
const CRITICAL_DB_ERROR_MSG =
  "Database client is not initialized. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are correctly set in your Vercel project."

// Helper to map form data to Supabase-compatible policy object
const mapFormDataToPolicyObject = (
  formData: FormData,
  existingPolicy?: PolicyDraft,
): Omit<PolicyDraft, "id" | "createdAt" | "lastModified" | "status"> & {
  id?: string
  status?: PolicyDraft["status"]
} => {
  const rawFormData: Record<string, any> = {}
  const keywords: string[] = []
  const targetAudience: string[] = []
  const nepThrustAreas: string[] = []
  const internalReviewCommittee: string[] = []

  formData.forEach((value, key) => {
    if (key === "keywords") keywords.push(value as string)
    else if (key === "targetAudience") targetAudience.push(value as string)
    else if (key === "nepThrustAreas") nepThrustAreas.push(value as string)
    else if (key === "internalReviewCommittee") internalReviewCommittee.push(value as string)
    else if (key.startsWith("annexures_") || key === "draftPolicyDocument_") {
      // Skip file objects for now, handle metadata separately
    } else if (key !== "action" && key !== "id" && !(value instanceof File && value.size === 0)) {
      rawFormData[key] = value
    }
  })

  const draftPolicyDocumentFile = formData.get("draftPolicyDocument") as File | null
  let draftPolicyDocumentData = existingPolicy?.draftPolicyDocument || null
  if (draftPolicyDocumentFile && draftPolicyDocumentFile.size > 0) {
    draftPolicyDocumentData = {
      name: draftPolicyDocumentFile.name,
      type: draftPolicyDocumentFile.type,
      size: draftPolicyDocumentFile.size,
    }
  } else if (formData.get("existingDraftPolicyDocumentName") && existingPolicy?.draftPolicyDocument) {
    draftPolicyDocumentData = existingPolicy.draftPolicyDocument
  }

  const annexuresFiles = formData.getAll("annexures").filter((f) => f instanceof File && f.size > 0) as File[]
  let annexuresData = existingPolicy?.annexures || []
  if (annexuresFiles.length > 0) {
    annexuresData = annexuresFiles.map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
    }))
  } else if (formData.getAll("existingAnnexureNames").length > 0 && existingPolicy?.annexures) {
    annexuresData = existingPolicy.annexures
  }

  return {
    title: rawFormData.title,
    policy_domain: rawFormData.policyDomain,
    version: rawFormData.version || existingPolicy?.version || "1.0",
    abstract_en: rawFormData.abstractEN,
    abstract_hi: rawFormData.abstractHI,
    keywords,
    target_audience: targetAudience,
    lead_drafter: rawFormData.leadDrafter || existingPolicy?.leadDrafter || "System User",
    nep_thrust_areas: nepThrustAreas,
    nep_alignment_justification: rawFormData.nepAlignmentJustification,
    draft_policy_document: draftPolicyDocumentData,
    annexures: annexuresData,
    internal_review_committee: internalReviewCommittee,
  }
}

const mapDbPolicyToPolicyDraft = (dbPolicy: any): PolicyDraft => {
  return {
    id: dbPolicy.id,
    title: dbPolicy.title,
    policyDomain: dbPolicy.policy_domain,
    version: dbPolicy.version,
    abstractEN: dbPolicy.abstract_en,
    abstractHI: dbPolicy.abstract_hi,
    keywords: dbPolicy.keywords || [],
    targetAudience: dbPolicy.target_audience || [],
    leadDrafter: dbPolicy.lead_drafter,
    nepThrustAreas: dbPolicy.nep_thrust_areas || [],
    nepAlignmentJustification: dbPolicy.nep_alignment_justification,
    draftPolicyDocument: dbPolicy.draft_policy_document,
    annexures: dbPolicy.annexures || [],
    internalReviewCommittee: dbPolicy.internal_review_committee || [],
    status: dbPolicy.status,
    createdAt: dbPolicy.created_at,
    lastModified: dbPolicy.last_modified,
  }
}

export async function submitPolicyAction(
  prevState: SubmitPolicyActionState,
  formData: FormData,
): Promise<SubmitPolicyActionState> {
  if (!isSupabaseAdminConfigured()) {
    console.warn("submitPolicyAction: Supabase admin client not configured.", CRITICAL_DB_ERROR_MSG)
    return {
      message: CRITICAL_DB_ERROR_MSG,
      success: false,
      errors: { _general: CRITICAL_DB_ERROR_MSG },
    }
  }
  // console.log("Supabase Action: submitPolicyAction received data.") // Keep for debugging if needed

  const policyIdFromForm = formData.get("id") as string | undefined
  const actionType = formData.get("action") as "saveDraft" | "submitForReview"

  let existingPolicyInDb: PolicyDraft | undefined
  if (policyIdFromForm) {
    const { data, error } = await supabaseAdmin!.from("policies").select("*").eq("id", policyIdFromForm).single()
    if (error && error.code !== "PGRST116") {
      // PGRST116 means no rows found, which is fine for a new policy check
      console.error("Error fetching existing policy:", error)
      return {
        message: "Error fetching existing policy data.",
        success: false,
        errors: { _general: "Database error while fetching existing policy." },
      }
    }
    if (data) existingPolicyInDb = mapDbPolicyToPolicyDraft(data)
  }

  const policyDataToSave = mapFormDataToPolicyObject(formData, existingPolicyInDb)

  const errors: Partial<Record<keyof PolicyDraft | "_general", string>> = {}
  if (!policyDataToSave.title || policyDataToSave.title.trim().length < 5) {
    errors.title = "Policy Title must be at least 5 characters long."
  }
  if (!policyDataToSave.policy_domain) {
    errors.policyDomain = "Policy Domain is required."
  }
  if (!policyDataToSave.abstract_en || policyDataToSave.abstract_en.trim().length < 20) {
    errors.abstractEN = "Abstract (English) must be at least 20 characters long."
  }
  if (actionType === "submitForReview" && !policyDataToSave.draft_policy_document) {
    errors.draftPolicyDocument = "Draft Policy Document is required for submission."
  }

  if (Object.keys(errors).length > 0) {
    // console.log("Supabase Action: Validation errors", errors) // Keep for debugging
    return {
      message: "Validation failed. Please check the form.",
      success: false,
      errors,
    }
  }

  const statusToSet = actionType === "saveDraft" ? "Draft" : "Pending Internal Review"

  if (policyIdFromForm) {
    const { data, error } = await supabaseAdmin!
      .from("policies")
      .update({ ...policyDataToSave, status: statusToSet })
      .eq("id", policyIdFromForm)
      .select()
      .single()

    if (error) {
      console.error("Supabase error updating policy:", error)
      return { message: "Failed to update policy.", success: false, errors: { _general: error.message } }
    }
    revalidatePath("/policies")
    revalidatePath(`/policies/view/${data.id}`)
    revalidatePath(`/policies/edit/${data.id}`)
    return {
      message: `Policy successfully updated! Status: ${statusToSet}. Policy ID: ${data.id}`,
      success: true,
      policyId: data.id,
    }
  } else {
    const { data, error } = await supabaseAdmin!
      .from("policies")
      .insert([{ ...policyDataToSave, status: statusToSet }])
      .select()
      .single()

    if (error) {
      console.error("Supabase error creating policy:", error)
      return { message: "Failed to create policy.", success: false, errors: { _general: error.message } }
    }
    revalidatePath("/policies")
    return {
      message: `Policy successfully created! Status: ${statusToSet}. Policy ID: ${data.id}`,
      success: true,
      policyId: data.id,
    }
  }
}

export interface PaginatedPoliciesResponse {
  policies: PolicyDraft[]
  totalCount: number
  totalPages: number
  currentPage: number
  itemsPerPage: number
  error?: string
}

const DEFAULT_ITEMS_PER_PAGE_ACTION = 10

export async function getPoliciesAction(params?: {
  sortBy?: keyof PolicyDraft | "lastModified" | "createdAt"
  sortOrder?: "asc" | "desc"
  filterByStatus?: PolicyDraft["status"]
  filterByDomain?: string
  searchQuery?: string
  page?: number
  itemsPerPage?: number
  modifiedAfter?: string
  modifiedBefore?: string
  createdAfter?: string
  createdBefore?: string
}): Promise<PaginatedPoliciesResponse> {
  const { page = 1, itemsPerPage = params?.itemsPerPage || DEFAULT_ITEMS_PER_PAGE_ACTION } = params || {}

  if (!isSupabaseAdminConfigured()) {
    console.warn("getPoliciesAction: Supabase admin client not configured.", CRITICAL_DB_ERROR_MSG)
    return {
      policies: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
      itemsPerPage,
      error: CRITICAL_DB_ERROR_MSG,
    }
  }

  const {
    sortBy: sortKey = "last_modified", // Default sort key
    sortOrder = "desc",
    filterByStatus,
    filterByDomain,
    searchQuery,
    modifiedAfter,
    modifiedBefore,
    createdAfter,
    createdBefore,
  } = params || {}

  let query = supabaseAdmin!.from("policies").select("*", { count: "exact" })

  const dbSortKeyMap: Record<string, string> = {
    title: "title",
    policyDomain: "policy_domain",
    status: "status",
    createdAt: "created_at",
    lastModified: "last_modified",
  }
  const dbSortBy = dbSortKeyMap[sortKey as string] || "last_modified"

  if (filterByStatus) query = query.eq("status", filterByStatus)
  if (filterByDomain) query = query.eq("policy_domain", filterByDomain)

  if (searchQuery && searchQuery.trim() !== "") {
    const lowercasedQuery = `%${searchQuery.trim().toLowerCase()}%`
    // Adjusted to search keywords as an array with 'cs' (contains)
    query = query.or(
      `title.ilike.${lowercasedQuery},abstract_en.ilike.${lowercasedQuery},keywords.cs.{${searchQuery.trim().replace(/%/g, "\\%").replace(/_/g, "\\_")}}`,
    )
  }

  if (modifiedAfter) query = query.gte("last_modified", new Date(modifiedAfter).toISOString())
  if (modifiedBefore) {
    const beforeDate = new Date(modifiedBefore)
    beforeDate.setUTCHours(23, 59, 59, 999) // Ensure end of day
    query = query.lte("last_modified", beforeDate.toISOString())
  }
  if (createdAfter) query = query.gte("created_at", new Date(createdAfter).toISOString())
  if (createdBefore) {
    const beforeDate = new Date(createdBefore)
    beforeDate.setUTCHours(23, 59, 59, 999) // Ensure end of day
    query = query.lte("created_at", beforeDate.toISOString())
  }

  query = query.order(dbSortBy, { ascending: sortOrder === "asc" })

  const startIndex = (page - 1) * itemsPerPage
  query = query.range(startIndex, startIndex + itemsPerPage - 1)

  const { data, error, count } = await query

  if (error) {
    console.error("Supabase error fetching policies:", error)
    return {
      policies: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
      itemsPerPage,
      error: `Database error: ${error.message}`,
    }
  }

  const policies = data ? data.map(mapDbPolicyToPolicyDraft) : []
  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return {
    policies,
    totalCount,
    totalPages,
    currentPage: page,
    itemsPerPage,
  }
}

export async function getPolicyByIdAction(id: string): Promise<PolicyDraft | undefined> {
  if (!isSupabaseAdminConfigured()) {
    console.warn("getPolicyByIdAction: Supabase admin client not configured.", CRITICAL_DB_ERROR_MSG)
    return undefined
  }
  const { data, error } = await supabaseAdmin!.from("policies").select("*").eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") {
      // "PGRST116" means "Query result has no rows"
      // console.log(`Policy with ID ${id} not found.`); // Optional: log for debugging
      return undefined
    }
    console.error("Supabase error fetching policy by ID:", error)
    return undefined
  }
  return data ? mapDbPolicyToPolicyDraft(data) : undefined
}

export async function deletePolicyAction(policyId: string): Promise<DeletePolicyActionState> {
  if (!isSupabaseAdminConfigured()) {
    console.warn("deletePolicyAction: Supabase admin client not configured.", CRITICAL_DB_ERROR_MSG)
    return { message: CRITICAL_DB_ERROR_MSG, success: false }
  }
  const { error } = await supabaseAdmin!.from("policies").delete().eq("id", policyId)

  if (error) {
    console.error("Supabase error deleting policy:", error)
    return { message: `Failed to delete policy ID ${policyId}. Error: ${error.message}`, success: false }
  }

  revalidatePath("/policies")
  return { message: `Policy ID ${policyId} deleted successfully.`, success: true, deletedPolicyId: policyId }
}

export async function clearPoliciesAction(): Promise<{ message: string }> {
  if (!isSupabaseAdminConfigured()) {
    console.warn("clearPoliciesAction: Supabase admin client not configured.", CRITICAL_DB_ERROR_MSG)
    return { message: CRITICAL_DB_ERROR_MSG }
  }
  // Delete all rows. Using a condition that won't match anything is a common trick,
  // but Supabase/Postgres allows direct delete without a WHERE clause to delete all.
  // Let's use a more direct approach if that's intended.
  // If you want to delete all, it's `supabaseAdmin!.from("policies").delete().gt('id', '')` or similar that matches all.
  // For safety, using a non-matching condition is fine if you want to be cautious.
  const { error } = await supabaseAdmin!.from("policies").delete().neq("id", "this-will-not-match-anything-hopefully")

  if (error) {
    console.error("Supabase error clearing policies:", error)
    return { message: `Failed to clear policies. Error: ${error.message}` }
  }
  revalidatePath("/policies")
  return { message: "All policies cleared from database." }
}

export async function seedPoliciesAction(count = 35): Promise<{ message: string; count: number }> {
  if (!isSupabaseAdminConfigured()) {
    console.warn("seedPoliciesAction: Supabase admin client not configured.", CRITICAL_DB_ERROR_MSG)
    return { message: CRITICAL_DB_ERROR_MSG, count: 0 }
  }

  // Using the structure from your seed script for consistency
  const { POLICY_DOMAINS, NEP_THRUST_AREAS, TARGET_AUDIENCES, REVIEW_COMMITTEES } = await import(
    "./policy-form-constants"
  )

  const tempPoliciesToSeed: any[] = [] // Using 'any' for simplicity matching the seed script structure
  const startDate = new Date(2023, 0, 1)
  const endDate = new Date()
  const statuses: PolicyDraft["status"][] = [
    "Draft",
    "Pending Internal Review",
    "Under Stakeholder Consultation",
    "Approved",
  ]

  const getRandomDateInternal = (start: Date, end: Date): string => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString()
  }
  const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const getRandomElements = <T,>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(count, shuffled.length))
  }

  for (let i = 0; i < count; i++) {
    const createdAtDate = getRandomDateInternal(startDate, endDate)
    const policyDomain = getRandomElement(POLICY_DOMAINS)
    tempPoliciesToSeed.push({
      // id: `POL-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`, // ID is auto-generated by DB
      title: `Seeded Policy #${i + 1}: Focus on ${policyDomain.toLowerCase()}`,
      policy_domain: policyDomain,
      version: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 5)}`,
      abstract_en: `This is a sample abstract for seeded policy #${i + 1}. It outlines key strategies for improving ${getRandomElement(NEP_THRUST_AREAS).toLowerCase()} and targets various stakeholders including ${getRandomElements(TARGET_AUDIENCES, 2).join(" and ")}. The current status is ${statuses[i % statuses.length]}.`,
      abstract_hi: `यह नीति #${i + 1} के लिए एक नमूना सार है।`,
      keywords: getRandomElements(
        ["education", "reform", "digital", "skill", "assessment", "curriculum", "teacher training", "innovation"],
        Math.floor(Math.random() * 3) + 1,
      ),
      target_audience: getRandomElements(TARGET_AUDIENCES, Math.floor(Math.random() * 3) + 2),
      lead_drafter: `User ${String.fromCharCode(65 + (i % 5))}`,
      nep_thrust_areas: getRandomElements(NEP_THRUST_AREAS, Math.floor(Math.random() * 2) + 1),
      nep_alignment_justification: `This policy aligns with NEP 2020 by focusing on ${getRandomElement(NEP_THRUST_AREAS)}.`,
      draft_policy_document: {
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
          : [], // Ensure it's an empty array if null for Supabase JSONB[]
      internal_review_committee: getRandomElements(REVIEW_COMMITTEES, Math.floor(Math.random() * 2) + 1),
      status: statuses[i % statuses.length],
      created_at: createdAtDate,
      // last_modified will be set by trigger or default to created_at on insert
    })
  }

  // Clear existing policies before seeding
  const { error: deleteError } = await supabaseAdmin!
    .from("policies")
    .delete()
    .neq("id", "this-will-not-match-anything")
  if (deleteError) {
    console.error("Supabase error clearing policies before seed:", deleteError)
    return { message: `Failed to clear policies before seeding. Error: ${deleteError.message}`, count: 0 }
  }

  const { data, error: insertError } = await supabaseAdmin!.from("policies").insert(tempPoliciesToSeed).select()

  if (insertError) {
    console.error("Supabase error seeding policies:", insertError)
    return { message: `Failed to seed policies. Error: ${insertError.message}`, count: 0 }
  }

  const seededCount = data ? data.length : 0
  revalidatePath("/policies")
  return { message: `${seededCount} policies seeded successfully into Supabase.`, count: seededCount }
}
