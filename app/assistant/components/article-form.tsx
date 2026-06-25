"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { emptyArticle, validateArticle, ARTICLE_CATEGORIES, type ArticleInput, type ArticleErrors } from "@/lib/knowledgebase"
import { createArticleAction, updateArticleAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function ArticleForm({ id, initial }: { id?: string; initial?: ArticleInput }) {
  const router = useRouter()
  const [f, setF] = useState<ArticleInput>(initial ?? emptyArticle())
  const [errors, setErrors] = useState<ArticleErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof ArticleInput>(k: K, v: ArticleInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  const shown = submitted ? validateArticle(f).errors : errors

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateArticle(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateArticleAction(id, f) : await createArticleAction(f)
      if (res.ok) router.push(id ? `/assistant/${id}` : "/assistant")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the article.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit knowledge article" : "New knowledge article"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="title">Title *</Label><Input id="title" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Pudhumai Penn eligibility" /><Err msg={shown.title} /></div>
          <div className="space-y-1.5"><Label htmlFor="cat">Category *</Label><select id="cat" value={f.category} onChange={(e) => set("category", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{ARTICLE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select><Err msg={shown.category} /></div>
        </div>
        <div className="space-y-1.5"><Label htmlFor="content">Content *</Label><Textarea id="content" value={f.content} onChange={(e) => set("content", e.target.value)} rows={5} placeholder="The grounded fact the assistant may quote (min 20 characters)…" /><Err msg={shown.content} /></div>
        <div className="space-y-1.5"><Label htmlFor="source">Source / citation *</Label><Input id="source" value={f.source} onChange={(e) => set("source", e.target.value)} placeholder="RTE Act 2009 · Sec 12(1)(c)" /><Err msg={shown.source} /></div>
        <p className="text-xs text-muted-foreground">Humans curate this canon; the assistant only answers from it and cites the source — it never invents.</p>
        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create article"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
