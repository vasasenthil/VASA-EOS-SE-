"use server"

import { integrations } from "@/lib/integrations"
import type { ContentItem, IntegrationMode } from "@/lib/integrations"

export interface ContentState {
  items: ContentItem[]
  mode?: IntegrationMode
  traceId?: string
  error?: string
  queried?: boolean
}

export async function discoverAction(_prev: ContentState, formData: FormData): Promise<ContentState> {
  const q = ((formData.get("q") as string) || "").trim()
  const subject = ((formData.get("subject") as string) || "").trim() || undefined
  const language = ((formData.get("language") as string) || "").trim() || undefined

  const res = await integrations.diksha.discover({ q: q || undefined, subject, language })
  if (!res.ok) {
    return { items: [], mode: res.mode, traceId: res.traceId, error: res.error ?? "Discovery failed", queried: true }
  }
  return { items: res.data ?? [], mode: res.mode, traceId: res.traceId, queried: true }
}
