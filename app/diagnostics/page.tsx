import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, Brain } from "lucide-react"
import { listDiagnosticsAction } from "./actions"
import { DiagnosticFilters } from "./components/diagnostic-filters"
import { DeleteDiagnosticButton, SeedDiagnosticsButton } from "./components/diagnostic-actions"
import { diagnose, type PlanStatus } from "@/lib/diagnostics"
import { safeDate } from "@/lib/format-date"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const PLAN_STYLE: Record<PlanStatus, string> = {
  "AI Draft": "bg-indigo-100 text-indigo-700",
  Approved: "bg-blue-100 text-blue-700",
  "In Progress": "bg-amber-100 text-amber-700",
  Completed: "bg-green-100 text-green-700",
}

interface SP { q?: string; subject?: string; class?: string; planStatus?: string; page?: string }

export default async function DiagnosticsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listDiagnosticsAction({ query: sp.q, subject: sp.subject, classLevel: sp.class, planStatus: sp.planStatus, sortBy: "date", sortDir: "desc", page })
  const demo = !isSupabaseAdminConfigured()
  const s = result.summary

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, subject: sp.subject, class: sp.class, planStatus: sp.planStatus })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/diagnostics?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Diagnostic Assessment & Remediation</PageHeaderHeading>
        <PageHeaderDescription>
          Native-AI assessment: the Assessment Engine scores a learner against a rubric and diagnoses
          <strong> per-objective mastery</strong> + the weak objectives needing remediation — explainably. The teacher
          reviews the diagnosis and <strong>approves a remediation plan</strong> (AI diagnoses, human decides).
        </PageHeaderDescription>
        <PageHeaderActions>
          <SeedDiagnosticsButton />
          <Button asChild><Link href="/diagnostics/new"><PlusCircle className="mr-2 h-4 w-4" />New diagnostic</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo diagnostics</strong> — no database is configured. Provision Supabase and seed to manage live diagnostics.
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Diagnostics", String(s.total), "text-foreground"],
          ["Need remediation", String(s.needingRemediation), s.needingRemediation > 0 ? "text-red-700" : "text-foreground"],
          ["Plan in progress", String(s.approved), "text-amber-700"],
          ["Completed", String(s.completed), "text-green-700"],
        ].map(([label, value, color]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <DiagnosticFilters />

      {result.diagnostics.length === 0 ? (
        <div className="rounded-md border py-12 text-center">
          <Brain className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">No diagnostics found</p>
          <p className="text-sm text-muted-foreground">Adjust filters, seed demo diagnostics, or create a new one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.diagnostics.map((d) => {
            const r = diagnose(d.items)
            return (
              <Card key={d.id} className={r.weakObjectives.length > 0 ? "border-red-200" : undefined}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{d.title}</CardTitle>
                    <Badge className={`${PLAN_STYLE[d.planStatus]} border-0`}>{d.planStatus}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{d.student} · Class {d.classLevel}-{d.section} · {d.subject}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="secondary">{r.pct}% · {r.band}</Badge>
                    {r.weakObjectives.length > 0 ? <Badge className="bg-red-100 text-red-700 border-0">{r.weakObjectives.length} weak objective{r.weakObjectives.length === 1 ? "" : "s"}</Badge> : <Badge className="bg-green-100 text-green-700 border-0">On track</Badge>}
                    <span className="ml-auto text-muted-foreground">{safeDate(d.date, "dd MMM")}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="icon"><Link href={`/diagnostics/${d.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                    <Button asChild variant="outline" size="icon"><Link href={`/diagnostics/${d.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                    <DeleteDiagnosticButton id={d.id} label={d.title} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {result.diagnostics.length} of {result.total} diagnostic{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}</span>
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
