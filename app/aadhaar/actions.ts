"use server"

import { integrations } from "@/lib/integrations"
import type { IntegrationMode } from "@/lib/integrations"

export interface AadhaarState {
  step: "idle" | "otp_sent" | "verified" | "failed"
  txnId?: string
  verified?: boolean
  mode?: IntegrationMode
  traceId?: string
  error?: string
}

export async function aadhaarAction(_prev: AadhaarState, formData: FormData): Promise<AadhaarState> {
  const op = (formData.get("op") as string) || "send"

  if (op === "send") {
    const ref = ((formData.get("ref") as string) || "").trim()
    if (!ref) return { step: "idle", error: "Enter the last 4 digits or a tokenised reference." }
    const res = await integrations.aadhaar.sendOtp(ref)
    if (!res.ok || !res.data) return { step: "failed", mode: res.mode, traceId: res.traceId, error: res.error ?? "OTP request failed." }
    return { step: "otp_sent", txnId: res.data.txnId, mode: res.mode, traceId: res.traceId }
  }

  // verify
  const txnId = ((formData.get("txnId") as string) || "").trim()
  const otp = ((formData.get("otp") as string) || "").trim()
  if (!txnId || !otp) return { step: "otp_sent", txnId, error: "Enter the OTP." }
  const res = await integrations.aadhaar.verifyOtp({ txnId, otp })
  if (!res.ok || !res.data) return { step: "failed", mode: res.mode, traceId: res.traceId, error: res.error ?? "Verification failed." }
  return { step: res.data.verified ? "verified" : "failed", txnId, verified: res.data.verified, mode: res.mode, traceId: res.traceId }
}
