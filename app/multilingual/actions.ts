"use server"

import { integrations } from "@/lib/integrations"

export interface TranslateState {
  text?: string
  audioRef?: string
  error?: string
  mode?: "mock" | "live"
}

export async function translateAction(_prev: TranslateState, formData: FormData): Promise<TranslateState> {
  const text = ((formData.get("text") as string) || "").trim()
  const from = (formData.get("from") as string) || "en"
  const to = (formData.get("to") as string) || "ta"
  if (!text) return { error: "Enter text to translate." }

  const res = await integrations.language.translate({ text, from, to })
  if (!res.ok || !res.data) return { error: res.error ?? "Translation failed.", mode: res.mode }

  // Synthesize speech for voice-first / IVR delivery.
  const tts = await integrations.language.tts({ text: res.data.text, language: to })
  return { text: res.data.text, audioRef: tts.data?.audioRef, mode: res.mode }
}
