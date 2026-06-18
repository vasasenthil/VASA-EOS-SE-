// VASA-EOS(SE) — Grounded Knowledge Base & Assistant: Conversational Engine wired with HITL.
//
// AI-native, grounded by construction — not a chatbot that invents: humans author the Tamil Nadu
// policy/scheme/pedagogy canon (durable knowledge articles); the Conversational Engine (lib/ai/
// engines/conversational, Engine 6 of 6) answers a natural-language question ONLY from that corpus,
// returning the answer with CITATIONS + a confidence, or says it doesn't know if nothing matches.
// Human authority loop: humans curate the canon (CRUD), the AI may only quote and cite it. Pure +
// client-safe; the ask action runs the engine over the live, durable KB.

import { converse, type Doc, type ConversationalResult } from "@/lib/ai/engines/conversational"

export type { ConversationalResult }

export const ARTICLE_CATEGORIES = [
  "Schemes",
  "RTE & Admissions",
  "Assessment & Exams",
  "Attendance",
  "Fees & DBT",
  "Grievance",
  "Policy (NEP/SEP)",
  "General",
] as const
export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number]

export interface Article {
  id: string
  title: string
  category: string
  content: string
  source: string
  createdAt: string
  updatedAt: string
}

export interface ArticleInput {
  title: string
  category: string
  content: string
  source: string
}

export function emptyArticle(): ArticleInput {
  return { title: "", category: "General", content: "", source: "" }
}

/** Map the knowledge base into the engine's corpus (title + content, sourced). */
export function asCorpus(articles: Article[]): Doc[] {
  return articles.map((a) => ({ id: a.id, text: `${a.title}. ${a.content}`, source: a.source || a.title }))
}

/** Ask the Conversational Engine over the live KB — genuinely calls Engine 6, grounded + cited. */
export function ask(query: string, articles: Article[]): ConversationalResult {
  return converse(query, asCorpus(articles))
}

export type ArticleErrors = Partial<Record<keyof ArticleInput, string>>

const MIN_CONTENT = 20

export function validateArticle(f: ArticleInput): { ok: boolean; errors: ArticleErrors } {
  const e: ArticleErrors = {}
  if (!f.title.trim()) e.title = "Title is required"
  if (!(ARTICLE_CATEGORIES as readonly string[]).includes(f.category)) e.category = "Select a category"
  if (f.content.trim().length < MIN_CONTENT) e.content = `Content must be at least ${MIN_CONTENT} characters`
  if (!f.source.trim()) e.source = "Cite a source (so answers are auditable)"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface ArticleFilters {
  query?: string
  category?: string
  page?: number
  pageSize?: number
}

export interface ArticlePage {
  articles: Article[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

const DEFAULT_PAGE_SIZE = 8

export function queryArticles(all: Article[], f: ArticleFilters = {}): ArticlePage {
  const q = (f.query ?? "").trim().toLowerCase()
  const rows = all.filter((a) => {
    if (q && !(`${a.title} ${a.content}`.toLowerCase().includes(q))) return false
    if (f.category && a.category !== f.category) return false
    return true
  }).sort((a, b) => (a.title < b.title ? -1 : a.title > b.title ? 1 : 0))
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { articles: rows.slice(start, start + pageSize), total, totalPages, page, pageSize }
}
