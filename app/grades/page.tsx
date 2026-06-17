import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, ClipboardList } from "lucide-react"
import { listGradesAction } from "./actions"
import { GradeFilters } from "./components/grade-filters"
import { DeleteGradeButton } from "./components/delete-grade-button"
import { SeedGradesButton } from "./components/seed-grades-button"
import { percentage, letterGrade } from "@/lib/grades"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

interface SP { q?: string; status?: string; class?: string; subject?: string; term?: string; sort?: "student" | "marks" | "createdAt"; page?: string }

export default async function GradesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listGradesAction({ query: sp.q, status: sp.status, classLevel: sp.class, subject: sp.subject, term: sp.term, sortBy: sp.sort, sortDir: "desc", page })
  const demo = !isSupabaseAdminConfigured()

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, status: sp.status, class: sp.class, subject: sp.subject, term: sp.term, sort: sp.sort })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/grades?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Gradebook</PageHeaderHeading>
        <PageHeaderDescription>Record and manage student marks per subject, term and assessment — with a derived percentage and letter grade. Filter, search, create, edit and publish.</PageHeaderDescription>
        <PageHeaderActions>
          <SeedGradesButton />
          <Button asChild><Link href="/grades/new"><PlusCircle className="mr-2 h-4 w-4" />New grade</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo grades</strong> — no database is configured. Provision Supabase and seed to manage live grades.
        </div>
      ) : null}

      <GradeFilters />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="hidden md:table-cell">Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="hidden lg:table-cell">Assessment</TableHead>
                <TableHead className="text-right">Marks</TableHead>
                <TableHead className="text-center">%</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.grades.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="h-24 text-center text-muted-foreground"><ClipboardList className="mx-auto mb-2 h-8 w-8" />No grades found. Adjust filters, seed demo grades, or add a new entry.</TableCell></TableRow>
              ) : (
                result.grades.map((g) => {
                  const pct = percentage(g.marks, g.maxMarks)
                  return (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.student}</TableCell>
                      <TableCell className="hidden md:table-cell">{g.classLevel}</TableCell>
                      <TableCell>{g.subject}</TableCell>
                      <TableCell className="hidden lg:table-cell">{g.assessment} · {g.term}</TableCell>
                      <TableCell className="text-right tabular-nums">{g.marks}/{g.maxMarks}</TableCell>
                      <TableCell className="text-center tabular-nums">{pct}%</TableCell>
                      <TableCell className="text-center"><Badge variant="outline">{letterGrade(pct)}</Badge></TableCell>
                      <TableCell><Badge className={g.status === "Published" ? "bg-green-100 text-green-700 border-0" : "bg-yellow-100 text-yellow-700 border-0"}>{g.status}</Badge></TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        <Button asChild variant="outline" size="icon"><Link href={`/grades/${g.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                        <Button asChild variant="outline" size="icon"><Link href={`/grades/${g.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                        <DeleteGradeButton id={g.id} student={g.student} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {result.grades.length} of {result.total} grade{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}</span>
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
