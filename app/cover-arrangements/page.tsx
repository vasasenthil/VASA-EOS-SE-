import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, UserCog, AlertTriangle } from "lucide-react"
import { listCoversAction } from "./actions"
import { CoverFilters } from "./components/cover-filters"
import { DeleteCoverButton, SeedCoversButton } from "./components/cover-actions"
import { type CoverStatus } from "@/lib/coverflow"
import { safeDate } from "@/lib/format-date"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<CoverStatus, string> = {
  Pending: "bg-red-100 text-red-700",
  Assigned: "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
}

interface SP { q?: string; date?: string; status?: string; reason?: string; sort?: "date" | "period"; page?: string }

export default async function CoverArrangementsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listCoversAction({ query: sp.q, date: sp.date, status: sp.status, reason: sp.reason, sortBy: sp.sort, sortDir: "asc", page })
  const demo = !isSupabaseAdminConfigured()
  const s = result.summary

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, date: sp.date, status: sp.status, reason: sp.reason, sort: sp.sort })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/cover-arrangements?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Cover Arrangements</PageHeaderHeading>
        <PageHeaderDescription>When a teacher is absent, every period must be covered. Track each uncovered period → assigned substitute → completion. The form suggests teachers free in that exact slot (from the timetable), so nothing is double-booked.</PageHeaderDescription>
        <PageHeaderActions>
          <SeedCoversButton />
          <Button asChild><Link href="/cover-arrangements/new"><PlusCircle className="mr-2 h-4 w-4" />New cover</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo cover arrangements</strong> — no database is configured. Provision Supabase and seed to manage live data.
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Arrangements", String(s.total), "text-foreground"],
          ["Uncovered (pending)", String(s.pending), s.pending > 0 ? "text-red-700" : "text-green-700"],
          ["Assigned", String(s.assigned), "text-blue-700"],
          ["Completed", String(s.completed), "text-green-700"],
        ].map(([label, value, color]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <CoverFilters />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead className="text-center">Class · Period</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Substitute</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.covers.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground"><UserCog className="mx-auto mb-2 h-8 w-8" />No cover arrangements. Adjust filters, seed demo data, or add one.</TableCell></TableRow>
              ) : (
                result.covers.map((c) => (
                  <TableRow key={c.id} className={c.status === "Pending" ? "bg-red-50/40" : undefined}>
                    <TableCell className="whitespace-nowrap">{safeDate(c.date, "dd MMM")}</TableCell>
                    <TableCell className="font-medium">{c.absentTeacher}<div className="text-xs text-muted-foreground">{c.reason}</div></TableCell>
                    <TableCell className="text-center">{c.classLevel}-{c.section} · P{c.period}</TableCell>
                    <TableCell>{c.subject}</TableCell>
                    <TableCell>{c.substituteTeacher || <span className="inline-flex items-center gap-1 text-red-600 text-xs"><AlertTriangle className="h-3.5 w-3.5" />uncovered</span>}</TableCell>
                    <TableCell><Badge className={`${STATUS_STYLE[c.status]} border-0`}>{c.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Button asChild variant="outline" size="icon"><Link href={`/cover-arrangements/${c.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                      <Button asChild variant="outline" size="icon"><Link href={`/cover-arrangements/${c.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                      <DeleteCoverButton id={c.id} label={`${c.absentTeacher} P${c.period}`} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {result.covers.length} of {result.total} arrangement{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}</span>
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
