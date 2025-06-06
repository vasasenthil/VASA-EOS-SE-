"use server"
import type { PolicyDraft } from "./policy-form-constants"

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
