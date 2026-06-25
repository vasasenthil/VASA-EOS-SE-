// VASA-EOS(SE) — digital e-content library (Flagship 07 / DIKSHA-aligned).
// A catalogue of digital learning resources with subject/type/language filtering.

export type ContentType = "Video" | "Document" | "Interactive" | "Audio"

export const CONTENT_TYPES: ContentType[] = ["Video", "Document", "Interactive", "Audio"]

export interface EContent {
  id: string
  title: string
  subject: string
  type: ContentType
  language: string
  url?: string
}

export const ECONTENT_LIBRARY: EContent[] = [
  { id: "ec1", title: "Fractions explained (Tamil)", subject: "Mathematics", type: "Video", language: "Tamil" },
  { id: "ec2", title: "Photosynthesis interactive", subject: "Science", type: "Interactive", language: "English" },
  { id: "ec3", title: "Thirukkural recitation", subject: "Tamil", type: "Audio", language: "Tamil" },
  { id: "ec4", title: "Indian freedom struggle notes", subject: "Social Science", type: "Document", language: "English" },
  { id: "ec5", title: "Place value drills", subject: "Mathematics", type: "Interactive", language: "Tamil" },
]

export function newContentId(): string {
  return `ec-${Math.random().toString(36).slice(2, 8)}`
}

export interface ContentFilter {
  subject?: string
  type?: ContentType
  q?: string
}

export function filterContent(items: EContent[], filter: ContentFilter = {}): EContent[] {
  const q = (filter.q ?? "").trim().toLowerCase()
  return items.filter((i) => {
    if (filter.subject && i.subject !== filter.subject) return false
    if (filter.type && i.type !== filter.type) return false
    if (q && !i.title.toLowerCase().includes(q)) return false
    return true
  })
}

export interface EContentSummary {
  total: number
  byType: Record<ContentType, number>
  subjects: number
}

export function econtentSummary(items: EContent[]): EContentSummary {
  const byType = Object.fromEntries(CONTENT_TYPES.map((t) => [t, 0])) as Record<ContentType, number>
  for (const i of items) byType[i.type] += 1
  return { total: items.length, byType, subjects: new Set(items.map((i) => i.subject)).size }
}
