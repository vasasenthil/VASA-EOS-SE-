// Live Bhashini language service — a real HTTP-backed adapter behind the
// LanguageService port, powering the platform's Tamil-first / 22-language mandate.
// Calls a provisioned Bhashini (ULCA / Dhruva) inference pipeline for translation
// and TTS. Selected only when INTEGRATION_BHASHINI=live; otherwise the mock is used.
//
// Config (see lib/integrations/config.ts):
//   INTEGRATION_BHASHINI=live        — flip this adapter on
//   BHASHINI_INFERENCE_URL=...       — provisioned inference endpoint (required)
//   BHASHINI_API_KEY=...             — inference Authorization key (required)
//   BHASHINI_TRANSLATION_SERVICE_ID  — optional explicit serviceId
//   BHASHINI_TTS_SERVICE_ID          — optional explicit serviceId
//
// ASR is intentionally not run live here: the port carries an opaque audioRef, not
// raw audio bytes, so a faithful speech-to-text call needs the audio-bytes pipeline.

import type { IntegrationResult, LanguageService } from "../types"
import { httpJson } from "../http"
import { bhashiniConfig } from "../config"

interface PipelineResponse {
  pipelineResponse?: {
    taskType?: string
    output?: { source?: string; target?: string }[]
    audio?: { audioContent?: string }[]
  }[]
}

function unconfigured(): IntegrationResult<never> {
  return { ok: false, error: "Bhashini inference endpoint/key not configured", mode: "live", traceId: "live-unconfigured" }
}

function langConfig(source: string, target?: string, serviceId?: string): Record<string, unknown> {
  const language: Record<string, string> = { sourceLanguage: source }
  if (target) language.targetLanguage = target
  const config: Record<string, unknown> = { language }
  if (serviceId) config.serviceId = serviceId
  return config
}

export const liveLanguage: LanguageService = {
  async translate(input): Promise<IntegrationResult<{ text: string }>> {
    const c = bhashiniConfig()
    if (!c.inferenceUrl || !c.apiKey) return unconfigured()

    const res = await httpJson<PipelineResponse>(c.inferenceUrl, {
      method: "POST",
      headers: { authorization: c.apiKey },
      timeoutMs: 15000,
      body: {
        pipelineTasks: [{ taskType: "translation", config: langConfig(input.from, input.to, c.translationServiceId) }],
        inputData: { input: [{ source: input.text }] },
      },
    })
    if (!res.ok) return { ok: false, error: res.error ?? "Translation failed", mode: "live", traceId: res.traceId }

    const target = res.data?.pipelineResponse?.[0]?.output?.[0]?.target
    if (!target) return { ok: false, error: "No translation returned", mode: "live", traceId: res.traceId }
    return { ok: true, data: { text: target }, mode: "live", traceId: res.traceId }
  },

  async tts(input): Promise<IntegrationResult<{ audioRef: string }>> {
    const c = bhashiniConfig()
    if (!c.inferenceUrl || !c.apiKey) return unconfigured()

    const res = await httpJson<PipelineResponse>(c.inferenceUrl, {
      method: "POST",
      headers: { authorization: c.apiKey },
      timeoutMs: 15000,
      body: {
        pipelineTasks: [{ taskType: "tts", config: langConfig(input.language, undefined, c.ttsServiceId) }],
        inputData: { input: [{ source: input.text }] },
      },
    })
    if (!res.ok) return { ok: false, error: res.error ?? "Speech synthesis failed", mode: "live", traceId: res.traceId }

    const audioContent = res.data?.pipelineResponse?.[0]?.audio?.[0]?.audioContent
    if (!audioContent) return { ok: false, error: "No audio returned", mode: "live", traceId: res.traceId }
    return { ok: true, data: { audioRef: `data:audio/wav;base64,${audioContent}` }, mode: "live", traceId: res.traceId }
  },

  async asr(): Promise<IntegrationResult<{ text: string }>> {
    // The port supplies an opaque audioRef, not raw audio bytes; live ASR requires
    // the audio-bytes pipeline. Surfaced as a clear typed result rather than a crash.
    return { ok: false, error: "Live ASR requires raw audio bytes (audioRef pipeline not wired)", mode: "live", traceId: "live-asr-unsupported" }
  },
}
