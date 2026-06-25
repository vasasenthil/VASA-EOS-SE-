import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, ClipboardList } from "lucide-react"
import { listAssignmentsAction } from "./actions"
import { AssignmentFilters } from "./components/assignment-filters"
import { DeleteAssignmentButton } from "./components/delete-assignment-button"
import { SeedAssignmentsButton } from "./components/seed-assignments-button"
import { dueBand, type AssignmentStatus } from "@/lib/assignments"
import { safeDate } from "@/lib/format-date"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<AssignmentStatus, string> = {
  Assigned: "bg-green-100 text-green-700",
  Draft: "bg-yellow-100 text-yellow-700",
  Closed: "bg-gray-100 text-gray-600",
}
const DUE_STYLE: Record<string, string> = {
  Overdue: "bg-red-100 text-red-700",
  "Due soon": "bg-orange-100 text-orange-700",
  Upcoming: "bg-blue-100 text-blue-700",
}

interface SP { q?: string; status?: string; class?: string; subject?: string; type?: string; sort?: "title" | "dueDate" | "createdAt"; page?: string }

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listAssignmentsAction({ query: sp.q, status: sp.status, classLevel: sp.class, subject: sp.subject, type: sp.type, sortBy: sp.sort, sortDir: "desc", page })
  const demo = !isSupabaseAdminConfigured()

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, status: sp.status, class: sp.class, subject: sp.subject, type: sp.type, sort: sp.sort })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/assignments?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Assignments</PageHeaderHeading>
        <PageHeaderDescription>Set and manage homework, projects, worksheets and lab work — by class, subject, type and due date. Filter, search, create, edit and close.</PageHeaderDescription>
        <PageHeaderActions>
          <SeedAssignmentsButton />
          <Button asChild><Link href="/assignments/new"><PlusCircle className="mr-2 h-4 w-4" />New assignment</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo assignments</strong> — no database is configured. Provision Supabase and seed to manage live assignments.
        </div>
      ) : null}

      <AssignmentFilters />

      {result.assignments.length === 0 ? (
        <div className="rounded-md border py-12 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">No assignments found</p>
          <p className="text-sm text-muted-foreground">Adjust filters, seed demo assignments, or add a new one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.assignments.map((a) => {
            const due = dueBand(a.dueDate, a.status)
            return (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{a.title}</CardTitle>
                    <Badge className={`${STATUS_STYLE[a.status]} border-0`}>{a.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.subject} · Class {a.classLevel} · {a.type}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{a.instructions}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Due {safeDate(a.dueDate, "dd MMM yyyy")}</span>
                    {due !== "—" ? <Badge className={`${DUE_STYLE[due]} border-0`}>{due}</Badge> : null}
                    <span className="text-muted-foreground ml-auto">{a.maxMarks} marks</span>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="icon"><Link href={`/assignments/${a.id}`} aria-label={`View ${a.title}`}><Eye className="h-4 w-4" /></Link></Button>
                    <Button asChild variant="outline" size="icon"><Link href={`/assignments/${a.id}/edit`} aria-label={`Edit ${a.title}`}><Pencil className="h-4 w-4" /></Link></Button>
                    <DeleteAssignmentButton id={a.id} title={a.title} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {result.assignments.length} of {result.total} assignment{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}</span>
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
