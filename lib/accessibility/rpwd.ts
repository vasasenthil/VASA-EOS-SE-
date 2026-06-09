// VASA-EOS(SE) — RPwD Act 2016 canonical disability register (Accessibility pillar).
//
// The Rights of Persons with Disabilities Act, 2016 specifies 21 disabilities in its
// Schedule, grouped into broad categories. This enumerates all 21 with their statutory
// group, the assistive-technology features the platform offers for each (keyed to
// lib/accessibility DEEP_ACCESSIBILITY so the mapping is self-verifying), the typical
// examination concession (CBSE/State norms: scribe + compensatory time for benchmark
// disability ≥40%), and whether the condition can qualify as a "benchmark disability".
// This is the canonical reference the CWSN/inclusion, exam-seating and accessibility
// modules align to. Pure + client-safe.

import { DEEP_ACCESSIBILITY } from "./index"

export type RpwdGroup =
  | "physical"
  | "intellectual"
  | "mental-behaviour"
  | "neurological-chronic"
  | "blood"
  | "multiple"

export interface RpwdDisability {
  id: string
  name: string
  group: RpwdGroup
  /** Assistive-technology feature keys (must exist in DEEP_ACCESSIBILITY). */
  assistiveTech: string[]
  /** Typical examination concession under RPwD / board norms. */
  examConcession: string
  /** Can be certified as a "benchmark disability" (≥40%) for reservation/concessions. */
  benchmarkEligible: boolean
}

// The 21 specified disabilities (RPwD Act 2016, Schedule).
export const RPWD_DISABILITIES: RpwdDisability[] = [
  { id: "blindness", name: "Blindness", group: "physical", assistiveTech: ["braille", "screen_readers", "keyboard", "reading"], examConcession: "Scribe + 20 min/hour compensatory time; Braille/large-print paper", benchmarkEligible: true },
  { id: "low-vision", name: "Low-vision", group: "physical", assistiveTech: ["screen_readers", "contrast", "text_scaling", "reading"], examConcession: "Large-print/magnification; compensatory time", benchmarkEligible: true },
  { id: "leprosy-cured", name: "Leprosy-cured persons", group: "physical", assistiveTech: ["voice_command", "keyboard"], examConcession: "Scribe if grip affected; accessible seating", benchmarkEligible: true },
  { id: "hearing-impairment", name: "Hearing impairment (deaf & hard of hearing)", group: "physical", assistiveTech: ["captions", "isl"], examConcession: "ISL interpreter for instructions; visual exam aids", benchmarkEligible: true },
  { id: "locomotor", name: "Locomotor disability", group: "physical", assistiveTech: ["switch_access", "voice_command", "keyboard"], examConcession: "Scribe + compensatory time; ground-floor accessible hall", benchmarkEligible: true },
  { id: "dwarfism", name: "Dwarfism", group: "physical", assistiveTech: ["keyboard"], examConcession: "Adjusted furniture; accessible seating", benchmarkEligible: true },
  { id: "muscular-dystrophy", name: "Muscular dystrophy", group: "physical", assistiveTech: ["switch_access", "voice_command"], examConcession: "Scribe + compensatory time; rest breaks", benchmarkEligible: true },
  { id: "cerebral-palsy", name: "Cerebral palsy", group: "physical", assistiveTech: ["switch_access", "eye_tracking", "voice_command"], examConcession: "Scribe + compensatory time; AAC permitted", benchmarkEligible: true },
  { id: "acid-attack", name: "Acid attack victim", group: "physical", assistiveTech: ["contrast", "screen_readers", "voice_command"], examConcession: "Scribe/compensatory time if vision or grip affected", benchmarkEligible: true },
  { id: "speech-language", name: "Speech and language disability", group: "physical", assistiveTech: ["aac", "captions"], examConcession: "Written/AAC response permitted for viva", benchmarkEligible: true },
  { id: "intellectual", name: "Intellectual disability", group: "intellectual", assistiveTech: ["cognitive", "aac", "reading"], examConcession: "Simplified paper; scribe; exemption options", benchmarkEligible: true },
  { id: "specific-learning", name: "Specific learning disabilities", group: "intellectual", assistiveTech: ["reading", "text_scaling", "cognitive"], examConcession: "Scribe/reader + compensatory time; calculator/spell-check", benchmarkEligible: true },
  { id: "autism", name: "Autism spectrum disorder", group: "intellectual", assistiveTech: ["aac", "sensory", "cognitive"], examConcession: "Separate quiet room; scribe; sensory-friendly setting", benchmarkEligible: true },
  { id: "mental-illness", name: "Mental illness", group: "mental-behaviour", assistiveTech: ["sensory", "cognitive"], examConcession: "Separate room; flexible scheduling; rest breaks", benchmarkEligible: true },
  { id: "multiple-sclerosis", name: "Multiple sclerosis", group: "neurological-chronic", assistiveTech: ["voice_command", "switch_access"], examConcession: "Scribe + compensatory time; rest breaks", benchmarkEligible: true },
  { id: "parkinsons", name: "Parkinson's disease", group: "neurological-chronic", assistiveTech: ["voice_command", "switch_access", "eye_tracking"], examConcession: "Scribe + compensatory time", benchmarkEligible: true },
  { id: "chronic-neurological", name: "Chronic neurological conditions", group: "neurological-chronic", assistiveTech: ["voice_command", "keyboard", "sensory"], examConcession: "Scribe/compensatory time per assessment", benchmarkEligible: true },
  { id: "thalassemia", name: "Thalassemia", group: "blood", assistiveTech: [], examConcession: "Flexible scheduling; medical leave; rest breaks", benchmarkEligible: true },
  { id: "haemophilia", name: "Haemophilia", group: "blood", assistiveTech: [], examConcession: "Flexible scheduling; medical leave; rest breaks", benchmarkEligible: true },
  { id: "sickle-cell", name: "Sickle cell disease", group: "blood", assistiveTech: [], examConcession: "Flexible scheduling; medical leave; rest breaks", benchmarkEligible: true },
  { id: "multiple-disabilities", name: "Multiple disabilities (incl. deafblindness)", group: "multiple", assistiveTech: ["braille", "isl", "aac", "switch_access"], examConcession: "Scribe + compensatory time; deafblind communicator", benchmarkEligible: true },
]

export function rpwdById(id: string): RpwdDisability | undefined {
  return RPWD_DISABILITIES.find((d) => d.id === id)
}

export function byGroup(group: RpwdGroup): RpwdDisability[] {
  return RPWD_DISABILITIES.filter((d) => d.group === group)
}

export const RPWD_GROUPS: RpwdGroup[] = [
  "physical",
  "intellectual",
  "mental-behaviour",
  "neurological-chronic",
  "blood",
  "multiple",
]

export interface RpwdSummary {
  total: number
  groups: number
  benchmarkEligible: number
  withAssistiveTech: number
}

export function rpwdSummary(items: RpwdDisability[] = RPWD_DISABILITIES): RpwdSummary {
  return {
    total: items.length,
    groups: new Set(items.map((d) => d.group)).size,
    benchmarkEligible: items.filter((d) => d.benchmarkEligible).length,
    withAssistiveTech: items.filter((d) => d.assistiveTech.length > 0).length,
  }
}

/** Assistive-tech feature keys referenced that are NOT in the accessibility registry. */
export function unknownAssistiveTechKeys(items: RpwdDisability[] = RPWD_DISABILITIES): string[] {
  const known = new Set(DEEP_ACCESSIBILITY.map((f) => f.key))
  const bad = new Set<string>()
  for (const d of items) for (const k of d.assistiveTech) if (!known.has(k)) bad.add(k)
  return [...bad]
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(items: RpwdDisability[] = RPWD_DISABILITIES): string {
  const header = ["Disability", "Group", "Benchmark eligible", "Assistive tech", "Exam concession"]
  const rows = items.map((d) =>
    [d.name, d.group, d.benchmarkEligible ? "yes" : "no", d.assistiveTech.join("; "), d.examConcession]
      .map(csvField)
      .join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
