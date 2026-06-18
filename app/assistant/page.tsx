import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, BookOpen } from "lucide-react"
import { listArticlesAction } from "./actions"
import { AskPanel } from "./components/ask-panel"
import { DeleteArticleButton, SeedArticlesButton } from "./components/article-actions"
import { ARTICLE_CATEGORIES } from "@/lib/knowledgebase"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

interface SP { q?: string; category?: string; page?: string }

export default async function AssistantPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listArticlesAction({ query: sp.q, category: sp.category, page })
  const demo = !isSupabaseAdminConfigured()

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, category: sp.category })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/assistant?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Grounded Assistant & Knowledge Base</PageHeaderHeading>
        <PageHeaderDescription>
          Native-AI conversational help, grounded by construction: the Conversational Engine answers questions
          <strong> only from the curated Tamil Nadu canon</strong> below and <strong>cites its sources</strong> — if nothing
          matches it says so rather than inventing. Humans author the canon; the AI may only quote and cite it.
        </PageHeaderDescription>
        <PageHeaderActions>
          <SeedArticlesButton />
          <Button asChild><Link href="/assistant/new"><PlusCircle className="mr-2 h-4 w-4" />New article</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      <AskPanel />

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing the representative <strong>demo TN canon</strong> — no database is configured. Provision Supabase and seed to manage the live knowledge base.
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">Knowledge base</span>
        <Badge variant="secondary">{result.total} article{result.total === 1 ? "" : "s"}</Badge>
        <div className="ml-auto flex flex-wrap gap-1">
          <Button asChild variant={!sp.category ? "default" : "outline"} size="sm"><Link href="/assistant">All</Link></Button>
          {ARTICLE_CATEGORIES.map((c) => (
            <Button key={c} asChild variant={sp.category === c ? "default" : "outline"} size="sm"><Link href={`/assistant?category=${encodeURIComponent(c)}`}>{c}</Link></Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Article</TableHead><TableHead className="hidden md:table-cell">Category</TableHead><TableHead className="hidden lg:table-cell">Source</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {result.articles.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground"><BookOpen className="mx-auto mb-2 h-8 w-8" />No articles found. Seed the TN canon or add a new article.</TableCell></TableRow>
              ) : (
                result.articles.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}<div className="text-xs text-muted-foreground line-clamp-1">{a.content}</div></TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="outline">{a.category}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{a.source}</TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Button asChild variant="outline" size="icon"><Link href={`/assistant/${a.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                      <Button asChild variant="outline" size="icon"><Link href={`/assistant/${a.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                      <DeleteArticleButton id={a.id} title={a.title} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {result.articles.length} of {result.total} · page {result.page} of {result.totalPages}</span>
        {result.totalPages > 1 ? (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" disabled={result.page <= 1}><Link href={pageHref(result.page - 1)}><ArrowLeft className="mr-1 h-4 w-4" />Prev</Link></Button>
            <Button asChild variant="outline" size="sm" disabled={result.page >= result.totalPages}><Link href={pageHref(result.page + 1)}>Next<ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
        ) : null}
      </div>
    </Shell>
  )
}
