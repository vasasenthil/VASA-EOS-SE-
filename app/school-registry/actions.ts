"use server"

import { integrations } from "@/lib/integrations"
import type { IntegrationMode, SchoolRecord } from "@/lib/integrations"

export interface RegistryState {
  schools: SchoolRecord[]
  mode?: IntegrationMode
  traceId?: string
  error?: string
  queried?: boolean
}

export async function lookupAction(_prev: RegistryState, formData: FormData): Promise<RegistryState> {
  const op = (formData.get("op") as string) || "search"

  if (op === "get") {
    const code = ((formData.get("udise") as string) || "").trim()
    if (!code) return { schools: [], error: "Enter a UDISE code." }
    const res = await integrations.udise.getSchool(code)
    if (!res.ok) return { schools: [], mode: res.mode, traceId: res.traceId, error: res.error, queried: true }
    return { schools: res.data ? [res.data] : [], mode: res.mode, traceId: res.traceId, queried: true }
  }

  const q = ((formData.get("q") as string) || "").trim()
  if (!q) return { schools: [], error: "Enter a search term." }
  const res = await integrations.udise.search(q)
  if (!res.ok) return { schools: [], mode: res.mode, traceId: res.traceId, error: res.error, queried: true }
  return { schools: res.data ?? [], mode: res.mode, traceId: res.traceId, queried: true }
}
