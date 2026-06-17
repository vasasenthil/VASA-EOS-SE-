import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, GraduationCap } from "lucide-react"
import { listReportCardsAction } from "./actions"
import { ReportCardFilters } from "./components/reportcard-filters"
import { DeleteReportCardButton } from "./components/delete-reportcard-button"
import { SeedReportCardsButton } from "./components/seed-reportcards-button"
import { reportTotals } from "@/lib/reportcards"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

interface SP { q?: string; status?: string; class?: string; term?: string; outcome?: string; sort?: "student" | "pct" | "createdAt"; page?: string }

export default async function ReportCardsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listReportCardsAction({ query: sp.q, status: sp.status, classLevel: sp.class, term: sp.term, outcome: sp.outcome, sortBy: sp.sort, sortDir: "desc", page })
  const demo = !isSupabaseAdminConfigured()

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, status: sp.status, class: sp.class, term: sp.term, outcome: sp.outcome, sort: sp.sort })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/report-cards?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Report Cards</PageHeaderHeading>
        <PageHeaderDescription>Consolidated term results per student — per-subject marks rolled up into a total, percentage, overall grade and Pass/Fail outcome. Filter, search, create, edit and publish.</PageHeaderDescription>
        <PageHeaderActions>
          <SeedReportCardsButton />
          <Button asChild><Link href="/report-cards/new"><PlusCircle className="mr-2 h-4 w-4" />New report card</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo report cards</strong> — no database is configured. Provision Supabase and seed to manage live report cards.
        </div>
      ) : null}

      <ReportCardFilters />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="hidden md:table-cell">Class</TableHead>
                <TableHead className="hidden lg:table-cell">Term</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">%</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead className="text-center">Result</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.cards.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="h-24 text-center text-muted-foreground"><GraduationCap className="mx-auto mb-2 h-8 w-8" />No report cards found. Adjust filters, seed demo cards, or add a new one.</TableCell></TableRow>
              ) : (
                result.cards.map((c) => {
                  const t = reportTotals(c.subjects)
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.student}</TableCell>
                      <TableCell className="hidden md:table-cell">{c.classLevel}</TableCell>
                      <TableCell className="hidden lg:table-cell">{c.term}</TableCell>
                      <TableCell className="text-right tabular-nums">{t.obtained}/{t.max}</TableCell>
                      <TableCell className="text-center tabular-nums">{t.pct}%</TableCell>
                      <TableCell className="text-center"><Badge variant="outline">{t.grade}</Badge></TableCell>
                      <TableCell className="text-center"><Badge className={`${t.outcome === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} border-0`}>{t.outcome}</Badge></TableCell>
                      <TableCell><Badge className={c.status === "Published" ? "bg-green-100 text-green-700 border-0" : "bg-yellow-100 text-yellow-700 border-0"}>{c.status}</Badge></TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        <Button asChild variant="outline" size="icon"><Link href={`/report-cards/${c.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                        <Button asChild variant="outline" size="icon"><Link href={`/report-cards/${c.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                        <DeleteReportCardButton id={c.id} student={c.student} />
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
        <span>Showing {result.cards.length} of {result.total} report card{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}</span>
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
