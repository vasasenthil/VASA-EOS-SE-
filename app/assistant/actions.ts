"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listArticles, getArticle, createArticle, updateArticle, deleteArticle, seedArticles } from "@/lib/knowledgebase/store"
import { queryArticles, validateArticle, ask, type Article, type ArticleInput, type ArticleFilters, type ArticlePage, type ConversationalResult } from "@/lib/knowledgebase"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

/** Ask the Conversational Engine over the live, durable knowledge base — grounded + cited. */
export async function askAction(query: string): Promise<ConversationalResult> {
  noStore()
  try {
    return ask(query, await listArticles())
  } catch (e) {
    logger.error("assistant.ask failed", { error: String(e) })
    return { answer: "The assistant is unavailable right now. Please try again.", citations: [], grounded: false, confidence: 0, explanation: "Error.", humanAuthority: true }
  }
}

export async function listArticlesAction(filters: ArticleFilters = {}): Promise<ArticlePage> {
  noStore()
  try {
    return queryArticles(await listArticles(), filters)
  } catch (e) {
    logger.error("assistant.list failed", { error: String(e) })
    return { articles: [], total: 0, totalPages: 1, page: 1, pageSize: 8 }
  }
}

export async function getArticleAction(id: string): Promise<Article | null> {
  noStore()
  try {
    return (await getArticle(id)) ?? null
  } catch (e) {
    logger.error("assistant.get failed", { error: String(e) })
    return null
  }
}

export async function createArticleAction(input: ArticleInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage the knowledge base." }
  const v = validateArticle(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const a = await createArticle(input)
    revalidatePath("/assistant")
    return { ok: true, id: a.id }
  } catch (e) {
    logger.error("assistant.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateArticleAction(id: string, input: ArticleInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage the knowledge base." }
  const v = validateArticle(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateArticle(id, input)
    if (!updated) return { ok: false, reason: "Article not found." }
    revalidatePath("/assistant")
    revalidatePath(`/assistant/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("assistant.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteArticleAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage the knowledge base." }
  try {
    const ok = await deleteArticle(id)
    revalidatePath("/assistant")
    return { ok }
  } catch (e) {
    logger.error("assistant.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedArticlesAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed the knowledge base." }
  try {
    const count = await seedArticles()
    revalidatePath("/assistant")
    return { ok: true, count }
  } catch (e) {
    logger.error("assistant.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
