// VASA-EOS(SE) — the eight Native-AI pillars (brochure: "8 pillars × 6 engines × 6 agents").
//
// The capability pillars of the Native-AI fabric, each mapped to the in-repo evidence that
// delivers it, with an honest built / partial / pending status. Five pillars are realised by
// the deterministic engines; language and speech are real integration seams; vision/document
// AI is not yet built and is disclosed as pending. Built/partial rows cite a file that exists
// (asserted by tests/ai-pillars.test.ts); pending rows cite nothing.

import { type CapabilityStatus } from "@/lib/governance/role-capabilities"

export interface AiPillar {
  id: string
  name: string
  capability: string
  status: CapabilityStatus
  note: string
  repoRef: string
}

export const AI_PILLARS: AiPillar[] = [
  { id: "language", name: "Language (NLU / NLG)", capability: "Understanding & generation across 22 Indian languages.", status: "partial", note: "i18n language registry + Bhashini translation/TTS seam; full multilingual NLU/NLG not all live", repoRef: "lib/i18n/languages.ts" },
  { id: "reasoning", name: "Knowledge & Reasoning", capability: "Explainable inference over policy-as-code and knowledge.", status: "built", note: "Reasoning engine (forward-chaining, explainable)", repoRef: "lib/ai/engines/reasoning.ts" },
  { id: "personalisation", name: "Personalisation & Adaptivity", capability: "Adaptive next-step learning paths.", status: "built", note: "Personalisation engine (mastery + prerequisite gating)", repoRef: "lib/ai/engines/personalisation.ts" },
  { id: "assessment", name: "Assessment & Evaluation", capability: "Scoring, mastery and diagnostic feedback.", status: "built", note: "Assessment engine (rubric scoring + weak-objective diagnosis)", repoRef: "lib/ai/engines/assessment.ts" },
  { id: "analytics", name: "Analytics & Prediction", capability: "Statistics, trend and anomaly/risk detection.", status: "built", note: "Analytics engine (leave-one-out anomaly detection)", repoRef: "lib/ai/engines/analytics.ts" },
  { id: "conversational", name: "Conversational & Dialogue", capability: "Grounded, cited retrieval-augmented dialogue.", status: "built", note: "Conversational engine (grounded answers + citations)", repoRef: "lib/ai/engines/conversational.ts" },
  { id: "speech", name: "Speech (ASR / TTS)", capability: "Text-to-speech and speech recognition.", status: "partial", note: "Bhashini TTS via the language seam is live-capable; ASR is not wired (opaque audioRef)", repoRef: "lib/integrations/live/bhashini.ts" },
  { id: "vision", name: "Vision & Document AI", capability: "OMR, document extraction, accessibility vision.", status: "pending", note: "no vision/OMR adapter is built yet", repoRef: "" },
]

export const PILLAR_COUNT = AI_PILLARS.length

export interface PillarSummary {
  total: number
  built: number
  partial: number
  pending: number
  coveragePct: number
}

export function pillarSummary(items: AiPillar[] = AI_PILLARS): PillarSummary {
  const built = items.filter((p) => p.status === "built").length
  const partial = items.filter((p) => p.status === "partial").length
  const pending = items.filter((p) => p.status === "pending").length
  const total = items.length
  return { total, built, partial, pending, coveragePct: total ? Math.round(((built + partial * 0.5) / total) * 100) : 0 }
}
