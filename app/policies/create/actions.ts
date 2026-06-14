"use server"

import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server"
import { policyDemoData } from "@/lib/policy/demo"
import { put as vercelBlobPut, del as vercelBlobDel } from "@vercel/blob"

// Fallback/simulation functions (signatures match original intent)
let put: any = async (pathname?: string) => {
  console.warn(`Simulated @vercel/blob put for: ${pathname || "unknown"}`)
  return { url: `/uploads/simulated/${pathname || "error-put-not-loaded.txt"}` }
}
let del: any = async (url?: string | string[]) => {
  console.warn(`Simulated @vercel/blob del for: ${url || "unknown"}`)
  // Simulate successful deletion, original del returned void
}

const IS_SERVER_ENVIRONMENT = typeof process !== "undefined" && process.env?.NEXT_RUNTIME

if (IS_SERVER_ENVIRONMENT) {
  // In server environments, use the actual @vercel/blob functions
  put = vercelBlobPut
  del = vercelBlobDel
  // console.log("Using actual @vercel/blob functions in server environment."); // Optional: for debugging
} else {
  // In non-server environments, the simulation functions are already set.
  console.warn("Running in a non-server environment. @vercel/blob operations will be simulated.")
}

import type { PolicyDraft, FileMetadata, PolicyStatus, VersionHistoryEntry } from "./policy-form-constants"
import { revalidatePath } from "next/cache"
import {
  POLICY_DOMAINS,
  NEP_THRUST_AREAS,
  TARGET_AUDIENCES,
  REVIEW_COMMITTEES,
  POLICY_STATUSES,
} from "./policy-form-constants"

import { hasPermission } from "@/app/governance/rbac"
import { PERMISSIONS } from "@/app/governance/types"
import { getUserIdFromAction } from "@/lib/auth/server"

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

export interface UpdatePolicyStatusActionState {
  message: string
  success: boolean
  policyId?: string
  newStatus?: PolicyStatus
  error?: string
}

export interface DeletePolicyActionState {
  message: string
  success: boolean
  deletedPolicyId?: string
}

const CRITICAL_DB_ERROR_MSG =
  "Database client is not initialized. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are correctly set in your Vercel project."

const generateSeedPolicyDataInline = (count = 30): PolicyDraft[] => {
  const policies: PolicyDraft[] = []
  const startDate = new Date(2023, 0, 1)
  const endDate = new Date()
  const getRandomId = () => `POL-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
  const getRandomDate = (start: Date, end: Date): string =>
    new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString()
  const getRandomElement = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const getRandomElements = <T,>(arr: T[], num: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(num, shuffled.length))
  }

  for (let i = 0; i < count; i++) {
    const createdAtDate = new Date(getRandomDate(startDate, endDate))
    const lastModifiedDate = new Date(getRandomDate(createdAtDate, endDate))
    const currentStatus = getRandomElement(POLICY_STATUSES)
    const currentVersion = `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 5)}`

    const versionHistory: VersionHistoryEntry[] = []
    if (Math.random() > 0.3) {
      const historyDate = new Date(createdAtDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      versionHistory.push({
        version: "0.9",
        status: "Draft",
        modified_at: historyDate.toISOString(),
        summary: "Initial draft creation",
      })
      if (currentStatus !== "Draft" && Math.random() > 0.5) {
        const historyDate2 = new Date(createdAtDate.getTime() - Math.random() * 15 * 24 * 60 * 60 * 1000)
        versionHistory.push({
          version: Number.parseFloat(currentVersion) > 1 ? `${Number.parseFloat(currentVersion) - 0.1}` : "1.0",
          status: "Pending Internal Review",
          modified_at: historyDate2.toISOString(),
          summary: "Submitted for internal review",
        })
      }
    }
    versionHistory.push({
      version: currentVersion,
      status: currentStatus,
      modified_at: lastModifiedDate.toISOString(),
      summary: "Current version",
    })

    policies.push({
      id: getRandomId(),
      title: `Sample Policy Draft #${i + 1}: Focus on ${getRandomElement(POLICY_DOMAINS).toLowerCase()}`,
      policyDomain: getRandomElement(POLICY_DOMAINS),
      version: currentVersion,
      abstractEN: `This is a sample abstract for policy #${i + 1}. It outlines key strategies for improving ${getRandomElement(NEP_THRUST_AREAS).toLowerCase()} and targets various stakeholders including ${getRandomElements(TARGET_AUDIENCES, 2).join(" and ")}. The current status is ${currentStatus}.`,
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
        url: `/uploads/simulated/draft_policy_${i + 1}.pdf`,
        uploadedAt: new Date().toISOString(),
        isPlaceholder: true,
      },
      annexures:
        Math.random() > 0.5
          ? [
              {
                name: `annexure_${i + 1}_ref.docx`,
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                size: Math.floor(Math.random() * 1000000) + 50000,
                url: `/uploads/simulated/annexure_${i + 1}_ref.docx`,
                uploadedAt: new Date().toISOString(),
                isPlaceholder: true,
              },
            ]
          : null,
      internalReviewCommittee: getRandomElements(REVIEW_COMMITTEES, Math.floor(Math.random() * 2) + 1),
      status: currentStatus,
      createdAt: createdAtDate.toISOString(),
      lastModified: lastModifiedDate.toISOString(),
      versionHistory: versionHistory.sort(
        (a, b) => new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime(),
      ),
    })
  }
  return policies
}

const mapFormDataToPolicyObject = (
  formData: FormData,
  existingPolicy?: PolicyDraft,
): Omit<
  PolicyDraft,
  "id" | "createdAt" | "lastModified" | "status" | "draftPolicyDocument" | "annexures" | "versionHistory"
> & {
  id?: string
  status?: PolicyDraft["status"]
  draftPolicyDocumentForUpload?: File | null
  annexuresForUpload?: File[] | null
  existingDraftPolicyDocument?: FileMetadata | null
  existingAnnexures?: FileMetadata[] | null
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
    } else if (key !== "action" && key !== "id" && !(value instanceof File && value.size === 0)) {
      rawFormData[key] = value
    }
  })

  const draftPolicyDocumentFile = formData.get("draftPolicyDocument") as File | null
  const annexuresFiles = formData.getAll("annexures").filter((f) => f instanceof File && f.size > 0) as File[]

  return {
    title: rawFormData.title,
    policyDomain: rawFormData.policyDomain,
    version: rawFormData.version || existingPolicy?.version || "1.0",
    abstractEN: rawFormData.abstractEN,
    abstractHI: rawFormData.abstractHI,
    keywords,
    targetAudience,
    leadDrafter: rawFormData.leadDrafter || existingPolicy?.leadDrafter || "System User",
    nepThrustAreas,
    nepAlignmentJustification: rawFormData.nepAlignmentJustification,
    internalReviewCommittee,
    draftPolicyDocumentForUpload:
      draftPolicyDocumentFile && draftPolicyDocumentFile.size > 0 ? draftPolicyDocumentFile : null,
    annexuresForUpload: annexuresFiles.length > 0 ? annexuresFiles : null,
    existingDraftPolicyDocument: existingPolicy?.draftPolicyDocument as FileMetadata | null,
    existingAnnexures: existingPolicy?.annexures as FileMetadata[] | null,
  }
}

const mapDbPolicyToPolicyDraft = (dbPolicy: any): PolicyDraft => ({
  id: dbPolicy.id,
  title: dbPolicy.title,
  policyDomain: dbPolicy.policy_domain,
  version: dbPolicy.version,
  abstractEN: dbPolicy.abstract_en,
  abstractHI: dbPolicy.abstract_hi,
  keywords: dbPolicy.keywords || [],
  targetAudience: dbPolicy.target_audience || [],
  leadDrafter: dbPolicy.lead_drafter,
  nepAlignmentJustification: dbPolicy.nep_alignment_justification,
  draftPolicyDocument: dbPolicy.draft_policy_document as FileMetadata | null,
  annexures: dbPolicy.annexures as FileMetadata[] | null,
  internalReviewCommittee: dbPolicy.internal_review_committee || [],
  status: dbPolicy.status,
  createdAt: dbPolicy.created_at,
  lastModified: dbPolicy.last_modified,
  nepThrustAreas: dbPolicy.nep_thrust_areas || [],
  versionHistory: (dbPolicy.version_history || []) as VersionHistoryEntry[],
})

export async function submitPolicyAction(
  prevState: SubmitPolicyActionState,
  formData: FormData,
): Promise<SubmitPolicyActionState> {
  const userId = await getUserIdFromAction()
  if (!userId) {
    return { message: "Authentication required.", success: false, errors: { _general: "User not authenticated." } }
  }

  if (!isSupabaseAdminConfigured()) {
    return { message: CRITICAL_DB_ERROR_MSG, success: false, errors: { _general: CRITICAL_DB_ERROR_MSG } }
  }

  const policyIdFromForm = formData.get("id") as string | undefined
  const actionType = formData.get("action") as "saveDraft" | "submitForReview"

  const requiredPermission = policyIdFromForm ? PERMISSIONS.POLICY_UPDATE_NATIONAL : PERMISSIONS.POLICY_CREATE_NATIONAL
  // TODO: Determine OU context for policy actions if policies become OU-specific.
  // For now, checking permission without specific ouId (user needs it in any of their roles).
  const canPerformAction = await hasPermission({ userId, permissionString: requiredPermission })

  if (!canPerformAction) {
    const actionVerb = policyIdFromForm ? "update" : "create"
    return {
      message: `You do not have permission to ${actionVerb} policies.`,
      success: false,
      errors: { _general: "Permission denied." },
    }
  }

  const removeDraftPolicyDocumentFlag = formData.get("remove_draftPolicyDocument") === "true"
  const removeAnnexuresFlag = formData.get("remove_annexures") === "true"

  let existingPolicyInDb: PolicyDraft | undefined
  if (policyIdFromForm) {
    const { data, error } = await supabaseAdmin!.from("policies").select("*").eq("id", policyIdFromForm).single()
    if (error && error.code !== "PGRST116") {
      return { message: "Error fetching existing policy.", success: false, errors: { _general: "Database error." } }
    }
    if (data) existingPolicyInDb = mapDbPolicyToPolicyDraft(data)
  }

  const mappedData = mapFormDataToPolicyObject(formData, existingPolicyInDb)
  const {
    draftPolicyDocumentForUpload,
    annexuresForUpload,
    existingDraftPolicyDocument,
    existingAnnexures,
    ...policyDataCore
  } = mappedData

  const errors: Partial<Record<keyof PolicyDraft | "_general", string>> = {}
  if (!policyDataCore.title || policyDataCore.title.trim().length < 5) errors.title = "Title must be >= 5 chars."
  if (!policyDataCore.policyDomain) errors.policyDomain = "Policy Domain is required."
  if (!policyDataCore.abstractEN || policyDataCore.abstractEN.trim().length < 20)
    errors.abstractEN = "Abstract (EN) must be >= 20 chars."
  if (
    actionType === "submitForReview" &&
    !existingDraftPolicyDocument &&
    !draftPolicyDocumentForUpload &&
    !removeDraftPolicyDocumentFlag
  ) {
    errors.draftPolicyDocument = "Draft Policy Document is required for submission."
  }

  if (Object.keys(errors).length > 0) {
    return { message: "Validation failed.", success: false, errors }
  }

  let finalDraftDocMetadata: FileMetadata | null = existingDraftPolicyDocument || null
  let finalAnnexuresMetadata: FileMetadata[] | null = existingAnnexures || null

  try {
    if (removeDraftPolicyDocumentFlag && existingDraftPolicyDocument) {
      if (IS_SERVER_ENVIRONMENT && existingDraftPolicyDocument.url && !existingDraftPolicyDocument.isPlaceholder)
        await del(existingDraftPolicyDocument.url)
      finalDraftDocMetadata = null
    } else if (draftPolicyDocumentForUpload) {
      if (IS_SERVER_ENVIRONMENT && existingDraftPolicyDocument?.url && !existingDraftPolicyDocument.isPlaceholder)
        await del(existingDraftPolicyDocument.url)
      let blobUrl = `/uploads/simulated/${policyIdFromForm || "new_policy"}/${draftPolicyDocumentForUpload.name}`
      let isPlaceholder = true
      if (IS_SERVER_ENVIRONMENT) {
        const blob = await put(
          `policy_documents/${policyIdFromForm || "new_policy"}/${draftPolicyDocumentForUpload.name}`,
          draftPolicyDocumentForUpload,
          { access: "public", addRandomSuffix: true },
        )
        blobUrl = blob.url
        isPlaceholder = false
      }
      finalDraftDocMetadata = {
        name: draftPolicyDocumentForUpload.name,
        type: draftPolicyDocumentForUpload.type,
        size: draftPolicyDocumentForUpload.size,
        url: blobUrl,
        uploadedAt: new Date().toISOString(),
        isPlaceholder,
      }
    }

    if (removeAnnexuresFlag && existingAnnexures) {
      if (IS_SERVER_ENVIRONMENT) {
        for (const annex of existingAnnexures) if (annex.url && !annex.isPlaceholder) await del(annex.url)
      }
      finalAnnexuresMetadata = null
    } else if (annexuresForUpload && annexuresForUpload.length > 0) {
      if (IS_SERVER_ENVIRONMENT && existingAnnexures) {
        for (const annex of existingAnnexures) if (annex.url && !annex.isPlaceholder) await del(annex.url)
      }
      const uploadedAnnexures: FileMetadata[] = []
      for (const file of annexuresForUpload) {
        let blobUrl = `/uploads/simulated/${policyIdFromForm || "new_policy"}/${file.name}`
        let isPlaceholder = true
        if (IS_SERVER_ENVIRONMENT) {
          const blob = await put(`policy_annexures/${policyIdFromForm || "new_policy"}/${file.name}`, file, {
            access: "public",
            addRandomSuffix: true,
          })
          blobUrl = blob.url
          isPlaceholder = false
        }
        uploadedAnnexures.push({
          name: file.name,
          type: file.type,
          size: file.size,
          url: blobUrl,
          uploadedAt: new Date().toISOString(),
          isPlaceholder,
        })
      }
      finalAnnexuresMetadata = uploadedAnnexures.length > 0 ? uploadedAnnexures : null
    }
  } catch (blobError: any) {
    console.error("Vercel Blob operation error:", blobError)
    if (IS_SERVER_ENVIRONMENT)
      return {
        message: `File operation failed: ${blobError.message}`,
        success: false,
        errors: { _general: "File storage error." },
      }
    console.warn("File operation simulated due to non-server environment or error during Blob operation.")
  }

  const statusToSet = actionType === "saveDraft" ? "Draft" : "Pending Internal Review"
  const currentTime = new Date().toISOString()
  let newVersionHistory: VersionHistoryEntry[] = existingPolicyInDb?.versionHistory || []

  const significantChange =
    existingPolicyInDb &&
    (existingPolicyInDb.version !== policyDataCore.version ||
      existingPolicyInDb.status !== statusToSet ||
      JSON.stringify(existingPolicyInDb.draftPolicyDocument) !== JSON.stringify(finalDraftDocMetadata) ||
      existingPolicyInDb.abstractEN !== policyDataCore.abstractEN)

  if (existingPolicyInDb && significantChange) {
    const latestHistoryEntry = newVersionHistory[0]
    if (
      !latestHistoryEntry ||
      latestHistoryEntry.version !== existingPolicyInDb.version ||
      latestHistoryEntry.status !== existingPolicyInDb.status
    ) {
      newVersionHistory.unshift({
        version: existingPolicyInDb.version,
        status: existingPolicyInDb.status || "Draft",
        modified_at: existingPolicyInDb.lastModified || existingPolicyInDb.createdAt || currentTime,
        summary: "Previous version before update",
      })
    }
  }
  if (!policyIdFromForm || significantChange) {
    const currentHistoryEntry: VersionHistoryEntry = {
      version: policyDataCore.version,
      status: statusToSet,
      modified_at: currentTime,
      summary: policyIdFromForm ? "Updated to this version" : "Initial creation",
    }
    if (
      newVersionHistory.length === 0 ||
      newVersionHistory[0].version !== currentHistoryEntry.version ||
      newVersionHistory[0].status !== currentHistoryEntry.status
    ) {
      newVersionHistory.unshift(currentHistoryEntry)
    }
  }
  newVersionHistory = newVersionHistory.slice(0, 20)

  const dbPayload = {
    ...policyDataCore,
    policy_domain: policyDataCore.policyDomain,
    abstract_en: policyDataCore.abstractEN,
    abstract_hi: policyDataCore.abstractHI,
    target_audience: policyDataCore.targetAudience,
    nep_thrust_areas: policyDataCore.nepThrustAreas,
    internal_review_committee: policyDataCore.internalReviewCommittee,
    draft_policy_document: finalDraftDocMetadata,
    annexures: finalAnnexuresMetadata,
    status: statusToSet,
    last_modified: currentTime,
    version_history: newVersionHistory,
    ...(policyIdFromForm
      ? {}
      : { created_at: currentTime, id: `POL-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` }),
  }
  delete (dbPayload as any).policyDomain
  delete (dbPayload as any).abstractEN
  delete (dbPayload as any).abstractHI

  if (policyIdFromForm) {
    const { data, error } = await supabaseAdmin!
      .from("policies")
      .update(dbPayload)
      .eq("id", policyIdFromForm)
      .select()
      .single()
    if (error) return { message: "Failed to update policy.", success: false, errors: { _general: error.message } }
    revalidatePath("/policies")
    revalidatePath(`/policies/view/${data.id}`)
    revalidatePath(`/policies/edit/${data.id}`)
    return {
      message: `Policy updated. Status: ${statusToSet}. Version: ${data.version}. ID: ${data.id}`,
      success: true,
      policyId: data.id,
    }
  } else {
    const { data, error } = await supabaseAdmin!.from("policies").insert([dbPayload]).select().single()
    if (error) return { message: "Failed to create policy.", success: false, errors: { _general: error.message } }
    revalidatePath("/policies")
    return {
      message: `Policy created. Status: ${statusToSet}. Version: ${data.version}. ID: ${data.id}`,
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
  /** True when the no-database demo dataset is being shown. */
  demo?: boolean
}

const DEFAULT_ITEMS_PER_PAGE_ACTION = 10

export async function getPoliciesAction(params?: {
  sortBy?: keyof PolicyDraft | "lastModified" | "createdAt" | "version"
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
    // No database configured — demonstrate with representative TN / NEP-2020 policy drafts.
    const policies = policyDemoData()
    return { policies, totalCount: policies.length, totalPages: 1, currentPage: 1, itemsPerPage, demo: true }
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
    version: "version",
  }
  const dbSortBy = dbSortKeyMap[sortKey as string] || "last_modified"
  if (filterByStatus) query = query.eq("status", filterByStatus)
  if (filterByDomain) query = query.eq("policy_domain", filterByDomain)
  if (searchQuery?.trim()) {
    const sq = `%${searchQuery.trim().toLowerCase()}%`
    query = query.or(
      `title.ilike.${sq},abstract_en.ilike.${sq},keywords.cs.{${searchQuery.trim().replace(/%/g, "\\%").replace(/_/g, "\\_")}}`,
    )
  }
  if (modifiedAfter) query = query.gte("last_modified", new Date(modifiedAfter).toISOString())
  if (modifiedBefore) {
    const d = new Date(modifiedBefore)
    d.setUTCHours(23, 59, 59, 999)
    query = query.lte("last_modified", d.toISOString())
  }
  if (createdAfter) query = query.gte("created_at", new Date(createdAfter).toISOString())
  if (createdBefore) {
    const d = new Date(createdBefore)
    d.setUTCHours(23, 59, 59, 999)
    query = query.lte("created_at", d.toISOString())
  }
  query = query.order(dbSortBy, { ascending: sortOrder === "asc" })
  const startIndex = (page - 1) * itemsPerPage
  query = query.range(startIndex, startIndex + itemsPerPage - 1)
  // Demo dataset shown when the unfiltered first page comes back empty (empty/unseeded DB,
  // no auth, or a query error) so the page is never blank in a walkthrough; a real
  // filtered/searched query that returns nothing is respected.
  const unfiltered =
    !params?.searchQuery && !params?.filterByStatus && !params?.filterByDomain &&
    !params?.modifiedAfter && !params?.modifiedBefore && !params?.createdAfter && !params?.createdBefore && page === 1
  const policiesDemoResponse = (): PaginatedPoliciesResponse => {
    const policies = policyDemoData()
    return { policies, totalCount: policies.length, totalPages: 1, currentPage: 1, itemsPerPage, demo: true }
  }
  try {
    const { data, error, count } = await query
    if (error) return unfiltered ? policiesDemoResponse() : { policies: [], totalCount: 0, totalPages: 0, currentPage: page, itemsPerPage, error: `DB error: ${error.message}` }
    const policies = data ? data.map(mapDbPolicyToPolicyDraft) : []
    const totalCount = count || 0
    if (totalCount === 0 && unfiltered) return policiesDemoResponse()
    const totalPages = Math.ceil(totalCount / itemsPerPage)
    return { policies, totalCount, totalPages, currentPage: page, itemsPerPage }
  } catch (e) {
    // Supabase unreachable — fail soft to demo so the page still renders.
    console.error("getPoliciesAction failed; returning demo result:", e)
    return unfiltered ? policiesDemoResponse() : { policies: [], totalCount: 0, totalPages: 0, currentPage: page, itemsPerPage }
  }
}

export async function getPolicyByIdAction(id: string): Promise<PolicyDraft | undefined> {
  // No database — resolve the demo policy so list -> view navigation works.
  if (!isSupabaseAdminConfigured()) return policyDemoData().find((p) => p.id === id)
  try {
    const { data, error } = await supabaseAdmin!.from("policies").select("*").eq("id", id).single()
    if (error) {
      // No row / unseeded — fall back to a demo policy so a demo card opens.
      if (error.code === "PGRST116") return policyDemoData().find((p) => p.id === id)
      console.error("Supabase error fetching policy by ID:", error)
      return policyDemoData().find((p) => p.id === id)
    }
    return data ? mapDbPolicyToPolicyDraft(data) : policyDemoData().find((p) => p.id === id)
  } catch (e) {
    console.error("getPolicyByIdAction failed; returning undefined:", e)
    return undefined
  }
}

export async function deletePolicyAction(policyId: string): Promise<DeletePolicyActionState> {
  const userId = await getUserIdFromAction()
  if (!userId) {
    return { message: "Authentication required.", success: false }
  }

  // TODO: Determine OU context for policy deletion if policies become OU-specific.
  const canDelete = await hasPermission({ userId, permissionString: PERMISSIONS.POLICY_DELETE_NATIONAL })
  if (!canDelete) {
    return { message: "You do not have permission to delete policies.", success: false }
  }

  if (!isSupabaseAdminConfigured()) return { message: CRITICAL_DB_ERROR_MSG, success: false }
  if (IS_SERVER_ENVIRONMENT) {
    try {
      const policy = await getPolicyByIdAction(policyId)
      if (policy) {
        if (policy.draftPolicyDocument && "url" in policy.draftPolicyDocument && !policy.draftPolicyDocument.isPlaceholder)
          await del(policy.draftPolicyDocument.url)
        if (policy.annexures)
          for (const annex of policy.annexures) if ("url" in annex && !annex.isPlaceholder) await del(annex.url)
      }
    } catch (blobError: any) {
      console.warn(`Failed to delete blobs for policy ${policyId}: ${blobError.message}. Proceeding with DB deletion.`)
    }
  }
  const { error } = await supabaseAdmin!.from("policies").delete().eq("id", policyId)
  if (error) return { message: `Failed to delete policy. Error: ${error.message}`, success: false }
  revalidatePath("/policies")
  return { message: `Policy ID ${policyId} deleted.`, success: true, deletedPolicyId: policyId }
}

export async function clearPoliciesAction(): Promise<{ message: string }> {
  // Potentially add RBAC check here if clearing all policies is a restricted action
  // const userId = await getUserIdFromAction();
  // if (!userId || !(await hasPermission({ userId, permissionString: PERMISSIONS.POLICY_CLEAR_ALL /* example */ }))) {
  //   return { message: "Permission denied to clear all policies." };
  // }

  if (!isSupabaseAdminConfigured()) return { message: CRITICAL_DB_ERROR_MSG }
  if (IS_SERVER_ENVIRONMENT) {
    const { policies, error: fetchError } = await getPoliciesAction({ itemsPerPage: 1000 }) // Fetch all to delete blobs
    if (fetchError) console.warn(`Could not fetch policies to delete blobs: ${fetchError}. Blobs may remain.`)
    else {
      for (const policy of policies) {
        try {
          if (policy.draftPolicyDocument && "url" in policy.draftPolicyDocument && !policy.draftPolicyDocument.isPlaceholder)
            await del(policy.draftPolicyDocument.url)
          if (policy.annexures)
            for (const annex of policy.annexures) if ("url" in annex && !annex.isPlaceholder) await del(annex.url)
        } catch (blobError: any) {
          console.warn(`Failed to delete blobs for policy ${policy.id} during clear: ${blobError.message}`)
        }
      }
    }
  }
  const { error } = await supabaseAdmin!.from("policies").delete().neq("id", "dummy_id_to_clear_all") // Clear all
  if (error) return { message: `Failed to clear policies. Error: ${error.message}` }
  revalidatePath("/policies")
  return { message: "All policies cleared." }
}

export async function seedPoliciesAction(
  count = 35,
): Promise<{ message: string; count: number; success: boolean; error?: string }> {
  // Potentially add RBAC check here if seeding policies is a restricted action
  // const userId = await getUserIdFromAction();
  // if (!userId || !(await hasPermission({ userId, permissionString: PERMISSIONS.POLICY_SEED /* example */ }))) {
  //   return { message: "Permission denied to seed policies.", count: 0, success: false };
  // }

  if (!isSupabaseAdminConfigured()) {
    return { message: CRITICAL_DB_ERROR_MSG, count: 0, success: false, error: CRITICAL_DB_ERROR_MSG }
  }
  // Consider if clearPoliciesAction should also be RBAC protected if called from here
  await clearPoliciesAction()
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
    version_history: p.versionHistory,
  }))
  const { data, error: insertError } = await supabaseAdmin!.from("policies").insert(policiesForDb).select()
  if (insertError)
    return {
      message: `Failed to seed. Error: ${insertError.message}`,
      count: 0,
      success: false,
      error: insertError.message,
    }
  const seededCount = data ? data.length : 0
  revalidatePath("/policies")
  return {
    message: `${seededCount} policies seeded (with simulated files and version history).`,
    count: seededCount,
    success: true,
  }
}

export async function seedPolicyImplementationAction(
  implementationData: PolicyImplementationStatusSeed[],
): Promise<{ message: string; count: number; error?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { message: CRITICAL_DB_ERROR_MSG, count: 0, error: CRITICAL_DB_ERROR_MSG }
  }
  if (!implementationData || implementationData.length === 0) return { message: "No data to seed.", count: 0 }
  const policyIdsToClear = [...new Set(implementationData.map((item) => item.policy_id))]
  if (policyIdsToClear.length > 0) {
    await supabaseAdmin!.from("policy_implementation_status").delete().in("policy_id", policyIdsToClear)
  }
  const { data, error } = await supabaseAdmin!.from("policy_implementation_status").insert(implementationData).select()
  if (error) return { message: `Failed to seed. Error: ${error.message}`, count: 0, error: error.message }
  revalidatePath("/tracking/dashboard")
  return { message: `${data?.length || 0} policy implementation entries seeded.`, count: data?.length || 0 }
}

export async function updatePolicyStatusAction(
  policyId: string,
  newStatus: PolicyStatus,
): Promise<UpdatePolicyStatusActionState> {
  const userId = await getUserIdFromAction()
  if (!userId) {
    return { message: "Authentication required.", success: false, policyId, error: "User not authenticated." }
  }

  // TODO: Determine OU context for policy status updates if policies become OU-specific.
  // Using POLICY_UPDATE for now, consider a more granular permission like POLICY_UPDATE_STATUS
  const canUpdateStatus = await hasPermission({ userId, permissionString: PERMISSIONS.POLICY_UPDATE_NATIONAL }) // Or a more specific permission
  if (!canUpdateStatus) {
    return {
      message: "You do not have permission to update policy status.",
      success: false,
      policyId,
      newStatus,
      error: "Permission denied.",
    }
  }

  if (!isSupabaseAdminConfigured()) {
    return { message: CRITICAL_DB_ERROR_MSG, success: false, policyId, error: CRITICAL_DB_ERROR_MSG }
  }

  if (!policyId || !newStatus) {
    return { message: "Policy ID and new status are required.", success: false, policyId, error: "Missing parameters." }
  }

  if (!POLICY_STATUSES.includes(newStatus)) {
    return {
      message: `Invalid status: ${newStatus}.`,
      success: false,
      policyId,
      newStatus,
      error: "Invalid status value.",
    }
  }

  try {
    const { data: existingPolicyData, error: fetchError } = await supabaseAdmin!
      .from("policies")
      .select("version, version_history")
      .eq("id", policyId)
      .single()

    if (fetchError) {
      console.error("Error fetching policy for status update:", fetchError)
      return {
        message: `Failed to fetch policy: ${fetchError.message}`,
        success: false,
        policyId,
        newStatus,
        error: fetchError.message,
      }
    }

    const currentTime = new Date().toISOString()
    let currentVersionHistory: VersionHistoryEntry[] = (existingPolicyData.version_history ||
      []) as VersionHistoryEntry[]

    currentVersionHistory.unshift({
      version: existingPolicyData.version,
      status: newStatus,
      modified_at: currentTime,
      summary: `Status changed to ${newStatus}`,
    })
    currentVersionHistory = currentVersionHistory.slice(0, 20)

    const { data, error } = await supabaseAdmin!
      .from("policies")
      .update({
        status: newStatus,
        last_modified: currentTime,
        version_history: currentVersionHistory,
      })
      .eq("id", policyId)
      .select()
      .single()

    if (error) {
      console.error("Error updating policy status:", error)
      return {
        message: `Failed to update policy status: ${error.message}`,
        success: false,
        policyId,
        newStatus,
        error: error.message,
      }
    }

    revalidatePath("/policies")
    revalidatePath(`/policies/view/${policyId}`)
    revalidatePath(`/policies/edit/${policyId}`)

    return {
      message: `Policy status updated to "${newStatus}".`,
      success: true,
      policyId,
      newStatus,
    }
  } catch (e: any) {
    console.error("Unexpected error in updatePolicyStatusAction:", e)
    return {
      message: `An unexpected error occurred: ${e.message}`,
      success: false,
      policyId,
      newStatus,
      error: e.message,
    }
  }
}
