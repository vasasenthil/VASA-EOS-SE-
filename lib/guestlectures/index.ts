// VASA-EOS(SE) — guest lecture / resource-person register (community expertise).
// Record guest sessions, the expert and audience reached. Pure logic.

export const GL_DOMAINS = [
  "Career guidance",
  "Health & wellness",
  "STEM / innovation",
  "Arts & culture",
  "Civic / legal awareness",
  "Entrepreneurship",
]

export interface Lecture {
  id: string
  speaker: string
  topic: string
  org: string
  domain: string
  date: string
  audience: number
  cls: string
}

export interface GlSummary {
  lectures: number
  speakers: number
  audienceTotal: number
  domains: number
}

export function glSummary(lectures: Lecture[]): GlSummary {
  return {
    lectures: lectures.length,
    speakers: new Set(lectures.map((l) => l.speaker)).size,
    audienceTotal: lectures.reduce((sum, l) => sum + l.audience, 0),
    domains: new Set(lectures.map((l) => l.domain)).size,
  }
}
