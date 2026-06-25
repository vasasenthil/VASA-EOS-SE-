import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, NotebookPen } from "lucide-react"
import { listLessonPlansAction } from "./actions"
import { LessonPlanFilters } from "./components/lessonplan-filters"
import { DeleteLessonPlanButton } from "./components/delete-lessonplan-button"
import { SeedLessonPlansButton } from "./components/seed-lessonplans-button"
import { durationMinutes, type LessonStatus } from "@/lib/lessonplans"
import { safeDate } from "@/lib/format-date"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<LessonStatus, string> = {
  Delivered: "bg-green-100 text-green-700",
  Planned: "bg-blue-100 text-blue-700",
  Draft: "bg-yellow-100 text-yellow-700",
}

interface SP { q?: string; status?: string; class?: string; subject?: string; type?: string; sort?: "date" | "topic" | "createdAt"; page?: string }

export default async function LessonPlansPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listLessonPlansAction({ query: sp.q, status: sp.status, classLevel: sp.class, subject: sp.subject, lessonType: sp.type, sortBy: sp.sort, sortDir: "desc", page })
  const demo = !isSupabaseAdminConfigured()

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, status: sp.status, class: sp.class, subject: sp.subject, type: sp.type, sort: sp.sort })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/lesson-plans?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Lesson Plans</PageHeaderHeading>
        <PageHeaderDescription>Rich per-period lesson plans — topic, previous/further topics, objectives, lesson type (theory/practical/field work/project), what students must bring, homework, planner links and class notes (audio/video/document). Filter, search, create, edit and deliver.</PageHeaderDescription>
        <PageHeaderActions>
          <SeedLessonPlansButton />
          <Button asChild><Link href="/lesson-plans/new"><PlusCircle className="mr-2 h-4 w-4" />New lesson plan</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo lesson plans</strong> — no database is configured. Provision Supabase and seed to manage live plans.
        </div>
      ) : null}

      <LessonPlanFilters />

      {result.plans.length === 0 ? (
        <div className="rounded-md border py-12 text-center">
          <NotebookPen className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">No lesson plans found</p>
          <p className="text-sm text-muted-foreground">Adjust filters, seed demo plans, or create a new one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.plans.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{p.topic}</CardTitle>
                  <Badge className={`${STATUS_STYLE[p.status]} border-0`}>{p.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{p.subject} · Class {p.classLevel}-{p.section} · {p.lessonType}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{safeDate(p.date, "dd MMM yyyy")}</span>
                  <span>· P{p.period} ({durationMinutes(p.startTime, p.endTime)} min)</span>
                  <span className="ml-auto">{p.teacher}</span>
                </div>
                <div className="flex flex-wrap gap-1 text-xs">
                  {p.classNotes.length > 0 ? <Badge variant="secondary">{p.classNotes.length} note{p.classNotes.length === 1 ? "" : "s"}</Badge> : null}
                  {p.materialsToBring.length > 0 ? <Badge variant="outline">{p.materialsToBring.length} to bring</Badge> : null}
                  {p.homework ? <Badge variant="outline">homework</Badge> : null}
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="icon"><Link href={`/lesson-plans/${p.id}`} aria-label={`View ${p.topic}`}><Eye className="h-4 w-4" /></Link></Button>
                  <Button asChild variant="outline" size="icon"><Link href={`/lesson-plans/${p.id}/edit`} aria-label={`Edit ${p.topic}`}><Pencil className="h-4 w-4" /></Link></Button>
                  <DeleteLessonPlanButton id={p.id} topic={p.topic} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {result.plans.length} of {result.total} plan{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}</span>
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
