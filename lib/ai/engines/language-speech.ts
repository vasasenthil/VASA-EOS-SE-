export type LanguageSpeechTask = "translate" | "tts" | "asr" | "ocr"

export interface LanguageSpeechInput {
  task: LanguageSpeechTask
  sourceLanguage: "ta" | "en" | string
  targetLanguage?: "ta" | "en" | string
  dialect?: string
  containsMinorVoice?: boolean
  content: string
}

export interface LanguageSpeechPlan {
  allowed: boolean
  route: "bhashini" | "ai4bharat" | "human-review" | "blocked"
  output: string
  confidence: number
  guardrail: string
}

const TAMIL_DIALECTS_REQUIRING_PUBLISHED_ACCURACY = new Set(["madurai", "kongu", "nellai", "chennai", "delta", "nilgiris", "ramnad", "kanyakumari"])

export function planLanguageSpeech(input: LanguageSpeechInput): LanguageSpeechPlan {
  if (input.containsMinorVoice && input.task === "asr") {
    return {
      allowed: false,
      route: "blocked",
      output: "Minor voice biometric capture is blocked; use teacher-marked, QR/NFC or text-only alternatives.",
      confidence: 1,
      guardrail: "DPDP/child-safety: no facial, voice or gait biometric capture of minors.",
    }
  }

  const dialectGate = input.dialect && TAMIL_DIALECTS_REQUIRING_PUBLISHED_ACCURACY.has(input.dialect.toLowerCase())
  const route: LanguageSpeechPlan["route"] = dialectGate ? "human-review" : input.task === "translate" || input.task === "tts" ? "bhashini" : "ai4bharat"
  const target = input.targetLanguage ? ` → ${input.targetLanguage}` : ""

  return {
    allowed: true,
    route,
    output: `${input.task.toUpperCase()} ${input.sourceLanguage}${target}: ${input.content.slice(0, 96)}`,
    confidence: route === "human-review" ? 0.72 : 0.86,
    guardrail: route === "human-review" ? "Dialect accuracy must be published and reviewed before statewide scale-up." : "Tamil/English launch path with cited adapter route; no autonomous child contact.",
  }
}
