import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, Sparkles } from "lucide-react"
import { listPathwaysAction } from "./actions"
import { PathwayFilters } from "./components/pathway-filters"
import { DeletePathwayButton, SeedPathwaysButton } from "./components/pathway-actions"
import { recommend, type PathwayStatus } from "@/lib/pathways"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<PathwayStatus, string> = {
  "AI Draft": "bg-indigo-100 text-indigo-700",
  Approved: "bg-blue-100 text-blue-700",
  Active: "bg-amber-100 text-amber-700",
  Completed: "bg-green-100 text-green-700",
}

interface SP { q?: string; subject?: string; class?: string; planStatus?: string; page?: string }

export default async function LearningPathwaysPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listPathwaysAction({ query: sp.q, subject: sp.subject, classLevel: sp.class, planStatus: sp.planStatus, sortBy: "title", sortDir: "asc", page })
  const demo = !isSupabaseAdminConfigured()
  const s = result.summary

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, subject: sp.subject, class: sp.class, planStatus: sp.planStatus })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/learning-pathways?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Adaptive Learning Pathways</PageHeaderHeading>
        <PageHeaderDescription>
          Native-AI personalisation: the Personalisation Engine reads each learner&apos;s mastery across curriculum
          objectives (with prerequisites) and recommends the <strong>next objectives they&apos;re ready to learn</strong> —
          ranked, explained. The teacher reviews and <strong>approves the pathway</strong> (AI suggests, the human decides).
        </PageHeaderDescription>
        <PageHeaderActions>
          <SeedPathwaysButton />
          <Button asChild><Link href="/learning-pathways/new"><PlusCircle className="mr-2 h-4 w-4" />New pathway</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo pathways</strong> — no database is configured. Provision Supabase and seed to manage live pathways.
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Pathways", String(s.total), "text-foreground"],
          ["Have a ready next step", String(s.withReadyStep), "text-indigo-700"],
          ["Approved / active", String(s.active), "text-amber-700"],
          ["Completed", String(s.completed), "text-green-700"],
        ].map(([label, value, color]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <PathwayFilters />

      {result.pathways.length === 0 ? (
        <div className="rounded-md border py-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">No pathways found</p>
          <p className="text-sm text-muted-foreground">Adjust filters, seed demo pathways, or create a new one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.pathways.map((p) => {
            const r = recommend(p.objectives, p.threshold)
            const next = r.recommendations[0]
            return (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{p.title}</CardTitle>
                    <Badge className={`${STATUS_STYLE[p.planStatus]} border-0`}>{p.planStatus}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.student} · Class {p.classLevel}-{p.section} · {p.subject}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    {next ? <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-indigo-600" />Next: <strong>{next.label}</strong></span> : <span className="text-muted-foreground">No ready next step</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="icon"><Link href={`/learning-pathways/${p.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                    <Button asChild variant="outline" size="icon"><Link href={`/learning-pathways/${p.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                    <DeletePathwayButton id={p.id} label={p.title} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {result.pathways.length} of {result.total} pathway{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}</span>
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
