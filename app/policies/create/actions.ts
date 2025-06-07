"use server"

// Ensure this import is EXACTLY as follows and does NOT include getSupabaseInitializationError
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server"
import { put, del } from "@vercel/blob/server"
import type { PolicyDraft, FileMetadata } from "./policy-form-constants"
import { revalidatePath } from "next/cache"
// Removed: import { generateSeedPolicyData } from "../../../../scripts/seed-policies"
// Import constants needed for inlined generation logic
import { POLICY_DOMAINS, NEP_THRUST_AREAS, TARGET_AUDIENCES, REVIEW_COMMITTEES } from "./policy-form-constants"

// Interface for PolicyImplementationStatusSeed (if needed by other actions in this file)
interface PolicyImplementationStatusSeed {
  policy_id: string
  region_type: string
  region_code?: string
  region_name: string
  overall_status: string
  progress_percentage: number
  target_completion_date?: string
  actual_completion_date?: string
  key_indicators?: Record<string, any>
  summary_notes?: string
  last_updated_by?: string
}

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

const CRITICAL_DB_ERROR_MSG =
  "Database client is not initialized. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are correctly set in your Vercel project."

// Helper function for inlined policy generation
const generateSeedPolicyDataInline = (count = 30): PolicyDraft[] => {
  const policies: PolicyDraft[] = []
  const startDate = new Date(2023, 0, 1) // Jan 1, 2023
  const endDate = new Date() // Today

  const statuses: PolicyDraft["status"][] = [
    "Draft",
    "Pending Internal Review",
    "Under Stakeholder Consultation",
    "Approved",
  ]

  const getRandomId = () => `POL-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
  const getRandomDate = (start: Date, end: Date): string => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString()
  }
  const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const getRandomElements = <T,>(arr: T[], num: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(num, shuffled.length))
  }

  for (let i = 0; i < count; i++) {
    const createdAtDate = new Date(getRandomDate(startDate, endDate))
    const lastModifiedDate = new Date(getRandomDate(createdAtDate, endDate))

    const policy: PolicyDraft = {
      id: getRandomId(),
      title: `Sample Policy Draft #${i + 1}: Focus on ${getRandomElement(POLICY_DOMAINS).toLowerCase()}`,
      policyDomain: getRandomElement(POLICY_DOMAINS),
      version: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 5)}`,
      abstractEN: `This is a sample abstract for policy #${i + 1}. It outlines key strategies for improving ${getRandomElement(NEP_THRUST_AREAS).toLowerCase()} and targets various stakeholders including ${getRandomElements(TARGET_AUDIENCES, 2).join(" and ")}. The current status is ${statuses[i % statuses.length]}.`,
      abstractHI: `यह नीति #${i + 1} के लिए एक नमूना सार है।`,
      keywords: getRandomElements(
        ["education", "reform", "digital", "skill", "assessment", "curriculum", "teacher training", "innovation"],
        Math.floor(Math.random() * 3) + 1,
      ),
      targetAudience: getRandomElements(TARGET_AUDIENCES, Math.floor(Math.random() * 3) + 2),
      leadDrafter: `User ${String.fromCharCode(65 + (i % 5))}`,
      nepThrustAreas: getRandomElements(NEP_THRUST_AREAS, Math.floor(Math.random() * 2) + 1),
      nepAlignmentJustification: `This policy aligns with NEP 2020 by focusing on ${getRandomElement(NEP_THRUST_AREAS)}.`,
      draftPolicyDocument: {
        name: `draft_policy_${i + 1}.pdf`,
        type: "application/pdf",
        size: Math.floor(Math.random() * 5000000) + 100000,
        url: `https://example.com/placeholder/draft_policy_${i + 1}.pdf`, // Placeholder URL
        uploadedAt: new Date().toISOString(),
      },
      annexures:
        Math.random() > 0.5
          ? [
              {
                name: `annexure_${i + 1}_ref.docx`,
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                size: Math.floor(Math.random() * 1000000) + 50000,
                url: `https://example.com/placeholder/annexure_${i + 1}_ref.docx`, // Placeholder URL
                uploadedAt: new Date().toISOString(),
              },
            ]
          : null,
      internalReviewCommittee: getRandomElements(REVIEW_COMMITTEES, Math.floor(Math.random() * 2) + 1),
      status: statuses[i % statuses.length],
      createdAt: createdAtDate.toISOString(),
      lastModified: lastModifiedDate.toISOString(),
    }
    policies.push(policy)
  }
  return policies
}

const mapFormDataToPolicyObject = (
  formData: FormData,
  existingPolicy?: PolicyDraft,
): Omit<PolicyDraft, "id" | "createdAt" | "lastModified" | "status"> & {
  id?: string
  status?: PolicyDraft["status"]
  // These will hold File objects if new files are uploaded, or existing metadata
  draftPolicyDocumentForUpload?: File | null
  annexuresForUpload?: File[] | null
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
    else if (key.startsWith("annexures") || key.startsWith("draftPolicyDocument")) {
      // File inputs are handled separately below
    } else if (key !== "action" && key !== "id" && !(value instanceof File && value.size === 0)) {
      rawFormData[key] = value
    }
  })

  let draftPolicyDocumentForUpload: File | null = null
  const draftPolicyDocumentFile = formData.get("draftPolicyDocument") as File | null
  if (draftPolicyDocumentFile && draftPolicyDocumentFile.size > 0) {
    draftPolicyDocumentForUpload = draftPolicyDocumentFile
  }

  let annexuresForUpload: File[] | null = null
  const annexuresFiles = formData.getAll("annexures").filter((f) => f instanceof File && f.size > 0) as File[]
  if (annexuresFiles.length > 0) {
    annexuresForUpload = annexuresFiles
  }

  // Preserve existing file metadata if no new file is uploaded
  let finalDraftPolicyDocument = existingPolicy?.draftPolicyDocument || null
  if (draftPolicyDocumentForUpload) {
    // Placeholder, will be replaced by FileMetadata after upload
    finalDraftPolicyDocument = null
  } else if (formData.get("remove_draftPolicyDocument") === "true") {
    finalDraftPolicyDocument = null
  }

  let finalAnnexures = existingPolicy?.annexures || null
  if (annexuresForUpload && annexuresForUpload.length > 0) {
    // Placeholder, will be replaced by FileMetadata[] after upload
    finalAnnexures = []
  } else if (formData.get("remove_annexures") === "true") {
    finalAnnexures = null
  }

  return {
    title: rawFormData.title,
    policyDomain: rawFormData.policyDomain, // Ensure this matches form field name
    version: rawFormData.version || existingPolicy?.version || "1.0",
    abstractEN: rawFormData.abstractEN, // Ensure this matches form field name
    abstractHI: rawFormData.abstractHI, // Ensure this matches form field name
    keywords,
    targetAudience,
    leadDrafter: rawFormData.leadDrafter || existingPolicy?.leadDrafter || "System User",
    nepThrustAreas,
    nepAlignmentJustification: rawFormData.nepAlignmentJustification, // Ensure this matches
    draftPolicyDocument: finalDraftPolicyDocument, // This will be updated post-upload
    annexures: finalAnnexures, // This will be updated post-upload
    internalReviewCommittee,
    // Pass through file objects for the main action to handle
    draftPolicyDocumentForUpload,
    annexuresForUpload,
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
    draftPolicyDocument: dbPolicy.draft_policy_document as FileMetadata | null, // Cast to FileMetadata
    annexures: dbPolicy.annexures as FileMetadata[] | null, // Cast to FileMetadata[]
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

  const policyIdFromForm = formData.get("id") as string | undefined
  const removeDraftPolicyDocument = formData.get("remove_draftPolicyDocument") === "true"
  const removeAnnexures = formData.get("remove_annexures") === "true"
  const actionType = formData.get("action") as "saveDraft" | "submitForReview"

  let existingPolicyInDb: PolicyDraft | undefined
  if (policyIdFromForm) {
    const { data, error } = await supabaseAdmin!.from("policies").select("*").eq("id", policyIdFromForm).single()
    if (error && error.code !== "PGRST116") {
      console.error("Error fetching existing policy:", error)
      return {
        message: "Error fetching existing policy data.",
        success: false,
        errors: { _general: "Database error while fetching existing policy." },
      }
    }
    if (data) existingPolicyInDb = mapDbPolicyToPolicyDraft(data)
  }

  const { draftPolicyDocumentForUpload, annexuresForUpload, ...policyMappedData } = mapFormDataToPolicyObject(
    formData,
    existingPolicyInDb,
  )
  let policyDataToSave: any = policyMappedData // Use 'any' temporarily, will be typed properly

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
  if (actionType === "submitForReview" && !policyDataToSave.draft_policy_document && !draftPolicyDocumentForUpload) {
    errors.draftPolicyDocument = "Draft Policy Document is required for submission."
  }

  if (Object.keys(errors).length > 0) {
    return {
      message: "Validation failed. Please check the form.",
      success: false,
      errors,
    }
  }

  const statusToSet = actionType === "saveDraft" ? "Draft" : "Pending Internal Review"
  const currentTime = new Date().toISOString()

  // --- File Upload Logic ---
  let uploadedDraftDocMetadata: FileMetadata | null = policyDataToSave.draftPolicyDocument
  let uploadedAnnexuresMetadata: FileMetadata[] = policyDataToSave.annexures || []

  // Handle Draft Policy Document Upload/Removal
  if (removeDraftPolicyDocument && existingPolicyInDb?.draftPolicyDocument) {
    const existingDoc = existingPolicyInDb.draftPolicyDocument as FileMetadata
    if (existingDoc.url) await del(existingDoc.url)
    uploadedDraftDocMetadata = null
  } else if (draftPolicyDocumentForUpload) {
    if (existingPolicyInDb?.draftPolicyDocument) {
      const existingDoc = existingPolicyInDb.draftPolicyDocument as FileMetadata
      if (existingDoc.url) await del(existingDoc.url) // Delete old blob
    }
    const blob = await put(
      `policy_documents/${policyIdFromForm || "new"}/${draftPolicyDocumentForUpload.name}`,
      draftPolicyDocumentForUpload,
      { access: "public", addRandomSuffix: false },
    )
    uploadedDraftDocMetadata = {
      name: draftPolicyDocumentForUpload.name,
      type: draftPolicyDocumentForUpload.type,
      size: draftPolicyDocumentForUpload.size,
      url: blob.url,
      uploadedAt: new Date().toISOString(),
    }
  }

  // Handle Annexures Upload/Removal
  if (removeAnnexures && existingPolicyInDb?.annexures) {
    for (const annex of existingPolicyInDb.annexures as FileMetadata[]) {
      if (annex.url) await del(annex.url)
    }
    uploadedAnnexuresMetadata = []
  } else if (annexuresForUpload && annexuresForUpload.length > 0) {
    // If replacing, delete all old annexures first
    if (existingPolicyInDb?.annexures && !removeAnnexures) {
      // only delete if not explicitly removing all
      for (const annex of existingPolicyInDb.annexures as FileMetadata[]) {
        if (annex.url) await del(annex.url)
      }
    }
    uploadedAnnexuresMetadata = [] // Reset for new uploads
    for (const file of annexuresForUpload) {
      const blob = await put(`policy_annexures/${policyIdFromForm || "new"}/${file.name}`, file, {
        access: "public",
        addRandomSuffix: false,
      })
      uploadedAnnexuresMetadata.push({
        name: file.name,
        type: file.type,
        size: file.size,
        url: blob.url,
        uploadedAt: new Date().toISOString(),
      })
    }
  }

  policyDataToSave = {
    ...policyDataToSave,
    draft_policy_document: uploadedDraftDocMetadata,
    annexures: uploadedAnnexuresMetadata.length > 0 ? uploadedAnnexuresMetadata : null,
    // Map other fields from policyMappedData to Supabase column names
    policy_domain: policyMappedData.policyDomain,
    abstract_en: policyMappedData.abstractEN,
    abstract_hi: policyMappedData.abstractHI,
    target_audience: policyMappedData.targetAudience,
    nep_thrust_areas: policyMappedData.nepThrustAreas,
    internal_review_committee: policyMappedData.internalReviewCommittee,
    nep_alignment_justification: policyMappedData.nepAlignmentJustification,
  }
  // Remove the temporary upload fields if they exist
  delete policyDataToSave.draftPolicyDocumentForUpload
  delete policyDataToSave.annexuresForUpload

  // --- End File Upload Logic ---

  const dbPayload = {
    title: policyDataToSave.title,
    policy_domain: policyDataToSave.policy_domain,
    version: policyDataToSave.version,
    abstract_en: policyDataToSave.abstract_en,
    abstract_hi: policyDataToSave.abstract_hi,
    keywords: policyDataToSave.keywords,
    target_audience: policyDataToSave.target_audience,
    lead_drafter: policyDataToSave.lead_drafter,
    nep_thrust_areas: policyDataToSave.nep_thrust_areas,
    nep_alignment_justification: policyDataToSave.nep_alignment_justification,
    draft_policy_document: policyDataToSave.draft_policy_document,
    annexures: policyDataToSave.annexures,
    internal_review_committee: policyDataToSave.internal_review_committee,
    status: statusToSet,
    last_modified: currentTime,
    ...(policyIdFromForm ? {} : { created_at: currentTime }), // Add created_at only for new policies
  }

  if (policyIdFromForm) {
    const { data, error } = await supabaseAdmin!
      .from("policies")
      .update(dbPayload)
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
    const { data, error } = await supabaseAdmin!.from("policies").insert([dbPayload]).select().single()

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
    sortBy: sortKey = "last_modified",
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
    query = query.or(
      `title.ilike.${lowercasedQuery},abstract_en.ilike.${lowercasedQuery},keywords.cs.{${searchQuery.trim().replace(/%/g, "\\%").replace(/_/g, "\\_")}}`,
    )
  }

  if (modifiedAfter) query = query.gte("last_modified", new Date(modifiedAfter).toISOString())
  if (modifiedBefore) {
    const beforeDate = new Date(modifiedBefore)
    beforeDate.setUTCHours(23, 59, 59, 999)
    query = query.lte("last_modified", beforeDate.toISOString())
  }
  if (createdAfter) query = query.gte("created_at", new Date(createdAfter).toISOString())
  if (createdBefore) {
    const beforeDate = new Date(createdBefore)
    beforeDate.setUTCHours(23, 59, 59, 999)
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
      // No rows found
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
  const { error } = await supabaseAdmin!.from("policies").delete().neq("id", "this-will-not-match-anything-hopefully")

  if (error) {
    console.error("Supabase error clearing policies:", error)
    return { message: `Failed to clear policies. Error: ${error.message}` }
  }
  revalidatePath("/policies")
  return { message: "All policies cleared from database." }
}

export async function seedPoliciesAction(
  count = 35,
): Promise<{ message: string; count: number; success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured()) {
    console.warn("seedPoliciesAction: Supabase admin client not configured.", CRITICAL_DB_ERROR_MSG)
    return { message: CRITICAL_DB_ERROR_MSG, count: 0, success: false, error: CRITICAL_DB_ERROR_MSG }
  }

  // Use the inlined generation logic
  const policiesToSeed = generateSeedPolicyDataInline(count)

  const policiesForDb = policiesToSeed.map((p) => ({
    id: p.id,
    title: p.title,
    policy_domain: p.policyDomain,
    version: p.version,
    status: p.status,
    abstract_en: p.abstractEN,
    abstract_hi: p.abstractHI,
    keywords: p.keywords,
    target_audience: p.targetAudience,
    lead_drafter: p.leadDrafter,
    nep_thrust_areas: p.nepThrustAreas,
    nep_alignment_justification: p.nepAlignmentJustification,
    draft_policy_document: p.draftPolicyDocument,
    annexures: p.annexures,
    internal_review_committee: p.internalReviewCommittee,
    created_at: p.createdAt,
    last_modified: p.lastModified,
  }))

  // Clear existing policies before seeding
  const { error: deleteError } = await supabaseAdmin!
    .from("policies")
    .delete()
    .neq("id", "this-will-not-match-anything-to-avoid-accidental-empty-delete")
  if (deleteError) {
    console.error("Supabase error clearing policies before seed:", deleteError)
    return {
      message: `Failed to clear policies before seeding. Error: ${deleteError.message}`,
      count: 0,
      success: false,
      error: deleteError.message,
    }
  }

  const { data, error: insertError } = await supabaseAdmin!.from("policies").insert(policiesForDb).select()

  if (insertError) {
    console.error("Supabase error seeding policies:", insertError)
    return {
      message: `Failed to seed policies. Error: ${insertError.message}`,
      count: 0,
      success: false,
      error: insertError.message,
    }
  }

  const seededCount = data ? data.length : 0
  revalidatePath("/policies")
  return { message: `${seededCount} policies seeded successfully into Supabase.`, count: seededCount, success: true }
}

export async function seedPolicyImplementationAction(
  implementationData: PolicyImplementationStatusSeed[],
): Promise<{ message: string; count: number; error?: string }> {
  if (!isSupabaseAdminConfigured()) {
    console.warn("seedPolicyImplementationAction: Supabase admin client not configured.", CRITICAL_DB_ERROR_MSG)
    return { message: CRITICAL_DB_ERROR_MSG, count: 0, error: CRITICAL_DB_ERROR_MSG }
  }

  if (!implementationData || implementationData.length === 0) {
    return { message: "No implementation data provided to seed.", count: 0 }
  }

  const policyIdsToClear = [...new Set(implementationData.map((item) => item.policy_id))]
  if (policyIdsToClear.length > 0) {
    const { error: deleteError } = await supabaseAdmin!
      .from("policy_implementation_status")
      .delete()
      .in("policy_id", policyIdsToClear)

    if (deleteError) {
      console.error("Supabase error clearing existing implementation data:", deleteError)
    }
  }

  const { data, error } = await supabaseAdmin!.from("policy_implementation_status").insert(implementationData).select()

  if (error) {
    console.error("Supabase error seeding policy implementation data:", error)
    return {
      message: `Failed to seed policy implementation data. Error: ${error.message}`,
      count: 0,
      error: error.message,
    }
  }

  const seededCount = data ? data.length : 0
  revalidatePath("/tracking/dashboard")
  return { message: `${seededCount} policy implementation entries seeded successfully.`, count: seededCount }
}
