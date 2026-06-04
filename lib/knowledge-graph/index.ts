// VASA-EOS(SE) — Curriculum Knowledge Graph (Flagship 07 / Sec 16 Pillar 2).
// Concepts as nodes; directed prerequisite edges. Topological learning paths and
// readiness checks drive sequencing for the adaptive engine. Pure graph logic;
// the production graph is persisted in a property-graph store behind the seam.

export interface Concept {
  id: string
  name: string
  subject: string
  grade: number
  prerequisites: string[] // concept ids that must precede this one
}

export const CONCEPTS: Concept[] = [
  { id: "count", name: "Counting", subject: "Math", grade: 1, prerequisites: [] },
  { id: "add", name: "Addition", subject: "Math", grade: 1, prerequisites: ["count"] },
  { id: "sub", name: "Subtraction", subject: "Math", grade: 2, prerequisites: ["count", "add"] },
  { id: "mul", name: "Multiplication", subject: "Math", grade: 3, prerequisites: ["add"] },
  { id: "div", name: "Division", subject: "Math", grade: 3, prerequisites: ["sub", "mul"] },
  { id: "place", name: "Place Value", subject: "Math", grade: 2, prerequisites: ["count"] },
  { id: "frac", name: "Fractions", subject: "Math", grade: 4, prerequisites: ["div", "place"] },
  { id: "dec", name: "Decimals", subject: "Math", grade: 5, prerequisites: ["frac", "place"] },
  { id: "ratio", name: "Ratio & Proportion", subject: "Math", grade: 6, prerequisites: ["frac"] },
  { id: "pct", name: "Percentages", subject: "Math", grade: 6, prerequisites: ["frac", "dec", "ratio"] },
]

const byId = new Map(CONCEPTS.map((c) => [c.id, c]))

export function getConcept(id: string): Concept | undefined {
  return byId.get(id)
}

/** All prerequisites (transitive) for a concept, nearest-first via BFS over edges. */
export function transitivePrerequisites(id: string): Concept[] {
  const seen = new Set<string>()
  const order: Concept[] = []
  const queue = [...(byId.get(id)?.prerequisites ?? [])]
  while (queue.length) {
    const cur = queue.shift()!
    if (seen.has(cur)) continue
    seen.add(cur)
    const c = byId.get(cur)
    if (c) {
      order.push(c)
      queue.push(...c.prerequisites)
    }
  }
  return order
}

/** Topologically-ordered learning path to reach a target concept (prereqs first). */
export function learningPath(targetId: string): Concept[] {
  const result: Concept[] = []
  const visited = new Set<string>()
  function visit(id: string) {
    if (visited.has(id)) return
    visited.add(id)
    const c = byId.get(id)
    if (!c) return
    for (const p of c.prerequisites) visit(p)
    result.push(c)
  }
  visit(targetId)
  return result
}

/** Is the learner ready for a concept given the set of mastered concept ids? */
export function isReady(targetId: string, mastered: Set<string>): boolean {
  const c = byId.get(targetId)
  if (!c) return false
  return c.prerequisites.every((p) => mastered.has(p))
}

/** Concepts immediately unlocked once `id` is mastered (direct dependents). */
export function unlocks(id: string): Concept[] {
  return CONCEPTS.filter((c) => c.prerequisites.includes(id))
}
