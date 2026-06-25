// VASA-EOS(SE) — Conversational Engine (Engine 6 of 6).
//
// Grounded retrieval-augmented response: given a natural-language query and a corpus of
// documents (the Tamil Nadu pedagogical / policy canon), it ranks documents by term overlap,
// composes an answer from the best match, and returns CITATIONS plus a confidence. Grounded
// by construction — it answers only from the corpus and cites sources; if nothing matches it
// says so rather than inventing. Deterministic; an LLM seam may refine, never replace, this.

export interface Doc {
  id: string
  text: string
  source: string
}

export interface Citation {
  id: string
  source: string
  score: number
}

export interface ConversationalResult {
  answer: string
  citations: Citation[]
  /** True when at least one corpus document supported the answer. */
  grounded: boolean
  confidence: number
  explanation: string
  humanAuthority: true
}

const STOP = new Set(["the", "a", "an", "of", "to", "in", "is", "are", "for", "and", "or", "what", "how", "do", "does", "i", "my"])

function terms(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
}

export function converse(query: string, corpus: Doc[]): ConversationalResult {
  const q = new Set(terms(query))
  if (q.size === 0 || corpus.length === 0) {
    return { answer: "I can only answer from the provided corpus, and I found nothing relevant.", citations: [], grounded: false, confidence: 0, explanation: "Empty query or corpus.", humanAuthority: true }
  }
  const scored = corpus
    .map((d) => {
      const dt = terms(d.text)
      const overlap = dt.filter((w) => q.has(w)).length
      const score = dt.length ? overlap / Math.sqrt(dt.length) : 0
      return { doc: d, overlap, score }
    })
    .filter((s) => s.overlap > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) {
    return { answer: "I can only answer from the provided corpus, and I found nothing relevant to that question.", citations: [], grounded: false, confidence: 0, explanation: "No corpus document matched the query terms.", humanAuthority: true }
  }
  const top = scored.slice(0, 3)
  const best = top[0]
  const citations: Citation[] = top.map((s) => ({ id: s.doc.id, source: s.doc.source, score: Math.round(s.score * 100) / 100 }))
  const matched = terms(best.doc.text).filter((w) => q.has(w)).length
  const confidence = Math.min(1, Math.round((matched / q.size) * 100) / 100)
  return {
    answer: best.doc.text,
    citations,
    grounded: true,
    confidence,
    explanation: `Answer grounded in ${citations.length} source(s); best match ${citations[0].source}.`,
    humanAuthority: true,
  }
}
