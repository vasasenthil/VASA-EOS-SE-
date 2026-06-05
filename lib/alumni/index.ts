// VASA-EOS(SE) — alumni registry (Sec 50 / community & mentorship).
// Register alumni by passing-out year; summarise by decade for engagement. Pure.

export interface Alumnus {
  id: string
  name: string
  batchYear: number
  occupation: string
  contact: string
}

export const SAMPLE_ALUMNI: Alumnus[] = [
  { id: "al-1", name: "Ravi Kumar", batchYear: 2008, occupation: "Civil Engineer", contact: "ravi@example.com" },
  { id: "al-2", name: "Meena S", batchYear: 2015, occupation: "Doctor", contact: "meena@example.com" },
  { id: "al-3", name: "Arjun P", batchYear: 2019, occupation: "Software Engineer", contact: "arjun@example.com" },
]

export function newAlumniId(): string {
  return `al-${Math.random().toString(36).slice(2, 8)}`
}

/** Decade label for a year, e.g. 2014 -> "2010s". */
export function decadeOf(year: number): string {
  return `${Math.floor(year / 10) * 10}s`
}

export interface AlumniSummary {
  total: number
  byDecade: Record<string, number>
  latestBatch: number
}

export function alumniSummary(list: Alumnus[]): AlumniSummary {
  const byDecade: Record<string, number> = {}
  let latestBatch = 0
  for (const a of list) {
    const d = decadeOf(a.batchYear)
    byDecade[d] = (byDecade[d] ?? 0) + 1
    if (a.batchYear > latestBatch) latestBatch = a.batchYear
  }
  return { total: list.length, byDecade, latestBatch }
}
