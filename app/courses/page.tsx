import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, BookOpen } from "lucide-react"
import { listCoursesAction } from "./actions"
import { CourseFilters } from "./components/course-filters"
import { DeleteCourseButton } from "./components/delete-course-button"
import { SeedCoursesButton } from "./components/seed-courses-button"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"
import type { CourseStatus } from "@/lib/courses"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<CourseStatus, string> = {
  Active: "bg-green-100 text-green-700",
  Draft: "bg-yellow-100 text-yellow-700",
  Archived: "bg-gray-100 text-gray-600",
}

interface SP {
  q?: string
  status?: string
  class?: string
  sort?: "name" | "code" | "createdAt"
  page?: string
}

export default async function CoursesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listCoursesAction({
    query: sp.q,
    status: sp.status,
    classLevel: sp.class,
    sortBy: sp.sort,
    sortDir: "desc",
    page,
  })
  const demo = !isSupabaseAdminConfigured()

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    if (sp.q) params.set("q", sp.q)
    if (sp.status) params.set("status", sp.status)
    if (sp.class) params.set("class", sp.class)
    if (sp.sort) params.set("sort", sp.sort)
    params.set("page", String(p))
    return `/courses?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Course Catalogue</PageHeaderHeading>
        <PageHeaderDescription>
          The academic courses offered across classes — subject, class, teacher, credits and lifecycle status. Create,
          edit, archive and search the full catalogue.
        </PageHeaderDescription>
        <PageHeaderActions>
          <SeedCoursesButton />
          <Button asChild>
            <Link href="/courses/new"><PlusCircle className="mr-2 h-4 w-4" />New course</Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing the representative <strong>demo catalogue</strong> — no database is configured. Provision Supabase and seed to manage live courses.
        </div>
      ) : null}

      <CourseFilters />

      {result.courses.length === 0 ? (
        <div className="rounded-md border py-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">No courses found</p>
          <p className="text-sm text-muted-foreground">Adjust the filters, seed the demo catalogue, or add a new course.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.courses.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <Badge className={`${STATUS_STYLE[c.status]} border-0`}>{c.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{c.code} · Class {c.classLevel}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                <div className="text-xs text-muted-foreground">{c.subjectArea} · {c.teacher} · {c.credits} credits</div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="icon"><Link href={`/courses/${c.id}`} aria-label={`View ${c.name}`}><Eye className="h-4 w-4" /></Link></Button>
                  <Button asChild variant="outline" size="icon"><Link href={`/courses/${c.id}/edit`} aria-label={`Edit ${c.name}`}><Pencil className="h-4 w-4" /></Link></Button>
                  <DeleteCourseButton id={c.id} name={c.name} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {result.courses.length} of {result.total} course{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}</span>
        {result.totalPages > 1 ? (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" disabled={result.page <= 1}>
              <Link href={pageHref(result.page - 1)}><ArrowLeft className="mr-1 h-4 w-4" />Prev</Link>
            </Button>
            <Button asChild variant="outline" size="sm" disabled={result.page >= result.totalPages}>
              <Link href={pageHref(result.page + 1)}>Next<ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        ) : null}
      </div>
    </Shell>
  )
}
