// VASA-EOS(SE) — reading campaign & FLN reading levels (NIPUN Bharat / ASER bands).
// Track each child's foundational reading band and books read. Pure logic.

export type ReadingLevel = "Beginner" | "Letter" | "Word" | "Paragraph" | "Story"

export const READING_LEVELS: ReadingLevel[] = ["Beginner", "Letter", "Word", "Paragraph", "Story"]

export function nextReadingLevel(l: ReadingLevel): ReadingLevel {
  const i = READING_LEVELS.indexOf(l)
  return i < 0 || i >= READING_LEVELS.length - 1 ? "Story" : READING_LEVELS[i + 1]
}

export interface Reader {
  id: string
  student: string
  cls: string
  level: ReadingLevel
  booksRead: number
}

export interface ReadingSummary {
  students: number
  fluent: number
  booksRead: number
  fluentPct: number
}

// "Fluent" = reads a full story (the NIPUN goal band).
export function readingSummary(readers: Reader[]): ReadingSummary {
  const students = readers.length
  const fluent = readers.filter((r) => r.level === "Story").length
  return {
    students,
    fluent,
    booksRead: readers.reduce((sum, r) => sum + r.booksRead, 0),
    fluentPct: students === 0 ? 0 : Math.round((fluent / students) * 100),
  }
}
