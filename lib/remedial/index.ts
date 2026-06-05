// VASA-EOS(SE) — remedial / NIPUN bridge classes (Sec 16 / Ennum Ezhuthum, FLN).
// Track foundational reading level on the Ennum Ezhuthum ladder and progress.

export type ReadingLevel = "Beginner" | "Letter" | "Word" | "Paragraph" | "Story"

export const READING_LEVELS: ReadingLevel[] = ["Beginner", "Letter", "Word", "Paragraph", "Story"]

export function levelIndex(level: ReadingLevel): number {
  return READING_LEVELS.indexOf(level)
}

/** Advance one rung up the ladder (Story is the top). */
export function nextReadingLevel(level: ReadingLevel): ReadingLevel {
  const i = levelIndex(level)
  return i < 0 || i >= READING_LEVELS.length - 1 ? "Story" : READING_LEVELS[i + 1]
}

export interface RemedialStudent {
  id: string
  name: string
  level: ReadingLevel
}

export interface RemedialSummary {
  total: number
  atStory: number // proficient (top of the ladder)
  needsSupport: number // Beginner or Letter
  avgIndex: number // mean level index (0-4)
}

export function remedialSummary(students: RemedialStudent[]): RemedialSummary {
  if (students.length === 0) return { total: 0, atStory: 0, needsSupport: 0, avgIndex: 0 }
  const avg = students.reduce((s, x) => s + levelIndex(x.level), 0) / students.length
  return {
    total: students.length,
    atStory: students.filter((x) => x.level === "Story").length,
    needsSupport: students.filter((x) => x.level === "Beginner" || x.level === "Letter").length,
    avgIndex: Math.round(avg * 10) / 10,
  }
}
