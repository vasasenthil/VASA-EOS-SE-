import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { emptyArticle, validateArticle, ask, asCorpus, queryArticles, ARTICLE_CATEGORIES, type Article, type ArticleInput } from "@/lib/knowledgebase"
import { listArticles, getArticle, createArticle, updateArticle, deleteArticle, seedArticles } from "@/lib/knowledgebase/store"

function art(over: Partial<Article>): Article {
  return { id: "a", title: "Pudhumai Penn eligibility", category: "Schemes", content: "Pudhumai Penn gives girl students from government schools ₹1000 monthly for higher education via DBT.", source: "TN Scheme", createdAt: "", updatedAt: "", ...over }
}

test("ask genuinely runs the Conversational Engine: grounded answer with citations", () => {
  const kb = [
    art({ id: "pp", title: "Pudhumai Penn eligibility", content: "Girl students from government schools get ₹1000 monthly for higher education." }),
    art({ id: "rte", title: "RTE 25%", content: "Private schools reserve 25% seats for disadvantaged children admitted free." }),
  ]
  const r = ask("Who is eligible for Pudhumai Penn?", kb)
  assert.equal(r.humanAuthority, true)
  assert.equal(r.grounded, true)
  assert.ok(r.citations.length >= 1)
  assert.equal(r.citations[0].id, "pp") // best match is the Pudhumai Penn article
  assert.match(r.answer, /government schools/i)
})

test("ask is grounded by construction: no corpus match → admits it, no citations", () => {
  const kb = [art({ id: "pp" })]
  const r = ask("What is the capital of France?", kb)
  assert.equal(r.grounded, false)
  assert.equal(r.citations.length, 0)
  assert.match(r.answer, /nothing relevant|only answer from/i)
})

test("asCorpus maps articles to sourced docs", () => {
  const docs = asCorpus([art({ id: "x", source: "Doc-1" })])
  assert.equal(docs[0].id, "x")
  assert.equal(docs[0].source, "Doc-1")
  assert.match(docs[0].text, /Pudhumai Penn/)
})

test("validation: title, category, content length, citable source", () => {
  const ok: ArticleInput = { title: "T", category: "Schemes", content: "This is a sufficiently long grounded fact.", source: "Src" }
  assert.equal(validateArticle(ok).ok, true)
  assert.ok(validateArticle({ ...ok, content: "too short" }).errors.content)
  assert.ok(validateArticle({ ...ok, source: "" }).errors.source)
  assert.ok(validateArticle({ ...ok, category: "Nope" }).errors.category)
  assert.ok(validateArticle(emptyArticle()).errors.title)
  assert.ok(ARTICLE_CATEGORIES.length >= 6)
})

test("queryArticles filters by category/search and paginates", () => {
  const all = Array.from({ length: 12 }, (_, i) => art({ id: `a${i}`, title: `Article ${i}`, category: i % 2 ? "Schemes" : "Attendance" }))
  assert.ok(queryArticles(all, { category: "Schemes" }).articles.every((a) => a.category === "Schemes"))
  assert.equal(queryArticles(all, { query: "Article 3" }).articles[0].title, "Article 3")
  const p = queryArticles(all, { pageSize: 5 })
  assert.equal(p.articles.length, 5)
  assert.equal(p.totalPages, 3)
})

test("store CRUD: create → read → update → delete (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createArticle({ title: "Test", category: "General", content: "A grounded fact long enough to pass.", source: "Src" })
  assert.match(created.id, /^KB-/)
  assert.equal((await getArticle(created.id))?.title, "Test")
  const updated = await updateArticle(created.id, { title: "Test 2", category: "General", content: "Updated grounded fact content.", source: "Src2" })
  assert.equal(updated?.title, "Test 2")
  assert.equal(await deleteArticle(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback seeded with the TN canon; seedArticles idempotent", async () => {
  __setTestDb(null)
  const before = await listArticles()
  assert.ok(before.length >= 8)
  assert.equal(await seedArticles(), 8)
  assert.equal((await listArticles()).length, before.length)
  // the seeded canon actually answers a question
  assert.equal(ask("RTE 25% free seats", before).grounded, true)
})
