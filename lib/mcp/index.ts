// VASA-EOS(SE) — MCP-style tool registry for tool-augmented, curriculum-grounded retrieval.
//
// The brief commits to "Retrieval-Augmented Generation with Model Context Protocol for
// curriculum-grounded, verifiably cited, tool-augmented agents". RAG already exists (the
// Conversational engine grounds answers in a corpus and cites them); the missing half is MCP — the
// uniform PROTOCOL by which a tool-augmented agent discovers typed tools, invokes them with validated
// inputs, and gets back structured, cited, human-authority results.
//
// This is the honest in-app analogue of the Model Context Protocol: a typed tool catalogue
// (describeTools), a uniform invoke(), and structured ToolResults that always carry citations and
// humanAuthority. It is NOT a network MCP server/transport or an LLM — it is the same SHAPE, wired to
// the real TN curriculum knowledge graph and the grounded retrieval engine. Pure + deterministic.

import { converse, type Doc, type Citation } from "@/lib/ai/engines/conversational"
import { CONCEPTS, getConcept, transitivePrerequisites, learningPath, type Concept } from "@/lib/knowledge-graph"

/** Grounding context an agent passes to a tool (the dynamic corpus; the curriculum graph is static). */
export interface ToolContext {
  corpus: Doc[]
}

export type ToolCategory = "Retrieval" | "Curriculum graph"

export interface ToolParam {
  name: string
  type: "string" | "number"
  required: boolean
  description: string
}

export interface ToolResult {
  ok: boolean
  toolName: string
  /** Human-legible result text. */
  summary: string
  /** Verifiable sources backing the result (RAG citations or the curriculum graph). */
  citations: Citation[]
  /** Structured payload for an agent to compose with. */
  data: Record<string, unknown>
  /** True when the result is backed by at least one source. */
  grounded: boolean
  reason?: string
  /** AI assists; a human decides on the result. */
  humanAuthority: true
}

export interface Tool {
  name: string
  title: string
  description: string
  category: ToolCategory
  params: ToolParam[]
  run(input: Record<string, string>, ctx: ToolContext): ToolResult
}

const GRAPH_CITATION: Citation = { id: "kg", source: "TN Curriculum Knowledge Graph", score: 1 }

/** Resolve a concept by id, else by case-insensitive name. */
function resolveConcept(s: string): Concept | undefined {
  const key = s.trim().toLowerCase()
  return getConcept(key) ?? CONCEPTS.find((c) => c.name.toLowerCase() === key)
}

export const TOOLS: Tool[] = [
  {
    name: "curriculum.retrieve",
    title: "Curriculum retrieval (RAG)",
    description: "Answer a natural-language question grounded in the TN pedagogical/policy corpus, citing its sources. Refuses to answer when nothing relevant is found.",
    category: "Retrieval",
    params: [{ name: "query", type: "string", required: true, description: "The question to answer from the corpus." }],
    run(input, ctx) {
      const r = converse(input.query ?? "", ctx.corpus)
      return {
        ok: true,
        toolName: "curriculum.retrieve",
        summary: r.answer,
        citations: r.citations,
        data: { confidence: r.confidence, explanation: r.explanation },
        grounded: r.grounded,
        humanAuthority: true,
      }
    },
  },
  {
    name: "concept.lookup",
    title: "Concept lookup",
    description: "Look up a curriculum concept (by id or name) in the knowledge graph — its subject and grade.",
    category: "Curriculum graph",
    params: [{ name: "concept", type: "string", required: true, description: "Concept id (e.g. frac) or name (e.g. Fractions)." }],
    run(input) {
      const c = resolveConcept(input.concept ?? "")
      if (!c) return { ok: false, toolName: "concept.lookup", summary: `No concept '${input.concept}' in the curriculum graph.`, citations: [], data: {}, grounded: false, reason: "not-found", humanAuthority: true }
      return {
        ok: true,
        toolName: "concept.lookup",
        summary: `${c.name} — ${c.subject}, Grade ${c.grade}.`,
        citations: [GRAPH_CITATION],
        data: { concept: c },
        grounded: true,
        humanAuthority: true,
      }
    },
  },
  {
    name: "concept.prerequisites",
    title: "Concept prerequisites",
    description: "List every prerequisite (transitive, nearest-first) a learner must master before a concept.",
    category: "Curriculum graph",
    params: [{ name: "concept", type: "string", required: true, description: "Concept id or name." }],
    run(input) {
      const c = resolveConcept(input.concept ?? "")
      if (!c) return { ok: false, toolName: "concept.prerequisites", summary: `No concept '${input.concept}' in the curriculum graph.`, citations: [], data: {}, grounded: false, reason: "not-found", humanAuthority: true }
      const prereqs = transitivePrerequisites(c.id)
      return {
        ok: true,
        toolName: "concept.prerequisites",
        summary: prereqs.length ? `${c.name} requires: ${prereqs.map((p) => p.name).join(" → ")}.` : `${c.name} has no prerequisites.`,
        citations: [GRAPH_CITATION],
        data: { concept: c, prerequisites: prereqs },
        grounded: true,
        humanAuthority: true,
      }
    },
  },
  {
    name: "learning.path",
    title: "Learning path",
    description: "Produce the ordered, prerequisite-respecting learning path that culminates in a target concept.",
    category: "Curriculum graph",
    params: [{ name: "concept", type: "string", required: true, description: "Target concept id or name." }],
    run(input) {
      const c = resolveConcept(input.concept ?? "")
      if (!c) return { ok: false, toolName: "learning.path", summary: `No concept '${input.concept}' in the curriculum graph.`, citations: [], data: {}, grounded: false, reason: "not-found", humanAuthority: true }
      const path = learningPath(c.id)
      return {
        ok: true,
        toolName: "learning.path",
        summary: `Path to ${c.name}: ${path.map((p) => p.name).join(" → ")}.`,
        citations: [GRAPH_CITATION],
        data: { concept: c, path },
        grounded: true,
        humanAuthority: true,
      }
    },
  },
]

export function listTools(): Tool[] {
  return TOOLS
}

export function getTool(name: string): Tool | undefined {
  return TOOLS.find((t) => t.name === name)
}

/** MCP-style tool descriptors — what an agent reads to choose a tool (no handlers). */
export interface ToolDescriptor {
  name: string
  title: string
  description: string
  category: ToolCategory
  params: ToolParam[]
}

export function describeTools(): ToolDescriptor[] {
  return TOOLS.map(({ name, title, description, category, params }) => ({ name, title, description, category, params }))
}

/**
 * Uniform invocation (the MCP-style entry point): resolve the tool, validate required inputs, run it.
 * Unknown tools and missing required params fail closed with a reason — never a thrown exception.
 */
export function invokeTool(name: string, input: Record<string, string>, ctx: ToolContext): ToolResult {
  const tool = getTool(name)
  if (!tool) {
    return { ok: false, toolName: name, summary: `Unknown tool '${name}'.`, citations: [], data: {}, grounded: false, reason: "unknown-tool", humanAuthority: true }
  }
  for (const p of tool.params) {
    if (p.required && !(input[p.name] ?? "").trim()) {
      return { ok: false, toolName: name, summary: `Missing required parameter '${p.name}'.`, citations: [], data: {}, grounded: false, reason: "missing-param", humanAuthority: true }
    }
  }
  return tool.run(input, ctx)
}

export interface ToolRegistrySummary {
  total: number
  retrieval: number
  curriculumGraph: number
}

export function toolRegistrySummary(): ToolRegistrySummary {
  return {
    total: TOOLS.length,
    retrieval: TOOLS.filter((t) => t.category === "Retrieval").length,
    curriculumGraph: TOOLS.filter((t) => t.category === "Curriculum graph").length,
  }
}
