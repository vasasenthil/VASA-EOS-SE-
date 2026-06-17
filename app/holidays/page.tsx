import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, CalendarOff, Repeat } from "lucide-react"
import { listHolidaysAction } from "./actions"
import { listHolidays } from "@/lib/holidays/store"
import { HolidayFilters } from "./components/holiday-filters"
import { DeleteHolidayButton } from "./components/delete-holiday-button"
import { SeedHolidaysButton } from "./components/seed-holidays-button"
import { holidayDays, type HolidayCategory } from "@/lib/holidays"
import { safeDate } from "@/lib/format-date"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const CATEGORY_STYLE: Record<HolidayCategory, string> = {
  National: "bg-red-100 text-red-700",
  State: "bg-orange-100 text-orange-700",
  Restricted: "bg-amber-100 text-amber-700",
  Local: "bg-yellow-100 text-yellow-700",
  Optional: "bg-lime-100 text-lime-700",
  "Exam Break": "bg-purple-100 text-purple-700",
  Vacation: "bg-blue-100 text-blue-700",
  Special: "bg-gray-100 text-gray-600",
}

interface SP { q?: string; category?: string; year?: string; month?: string; status?: string; sort?: "startDate" | "name" | "createdAt"; page?: string }

export default async function HolidaysPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listHolidaysAction({ query: sp.q, category: sp.category, academicYear: sp.year, month: sp.month, status: sp.status, sortBy: sp.sort ?? "startDate", sortDir: "asc", page })
  const years = Array.from(new Set((await listHolidays()).map((h) => h.academicYear))).sort()
  const demo = !isSupabaseAdminConfigured()

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, category: sp.category, year: sp.year, month: sp.month, status: sp.status, sort: sp.sort })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/holidays?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Holiday Calendar</PageHeaderHeading>
        <PageHeaderDescription>All categories of school holidays — National, State, Restricted, Local, Optional, Exam Break, Vacation and Special — with multi-day ranges and recurring annual festivals, per academic year. The Working-Time Scheduler reads this to compute real school days.</PageHeaderDescription>
        <PageHeaderActions>
          <SeedHolidaysButton />
          <Button asChild><Link href="/holidays/new"><PlusCircle className="mr-2 h-4 w-4" />New holiday</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing a representative <strong>demo TN holiday calendar</strong> — no database is configured. Provision Supabase and seed to manage live holidays.
        </div>
      ) : null}

      <div className="mb-4 flex items-center gap-3 rounded-md border bg-muted/40 px-4 py-3 text-sm">
        <CalendarOff className="h-5 w-5 text-muted-foreground" />
        <span>{result.total} holiday{result.total === 1 ? "" : "s"} · <strong>{result.totalDays}</strong> non-working day{result.totalDays === 1 ? "" : "s"} in view</span>
      </div>

      <HolidayFilters years={years} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Holiday</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-center">Days</TableHead>
                <TableHead className="hidden md:table-cell">Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.holidays.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground"><CalendarOff className="mx-auto mb-2 h-8 w-8" />No holidays found. Adjust filters, seed the demo calendar, or add a new holiday.</TableCell></TableRow>
              ) : (
                result.holidays.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-1">{h.name}{h.recurring ? <Repeat className="h-3 w-3 text-muted-foreground" /> : null}</span>
                    </TableCell>
                    <TableCell><Badge className={`${CATEGORY_STYLE[h.category]} border-0`}>{h.category}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap">{safeDate(h.startDate, "dd MMM")}{h.endDate !== h.startDate ? ` – ${safeDate(h.endDate, "dd MMM yyyy")}` : ` ${safeDate(h.startDate, "yyyy")}`}</TableCell>
                    <TableCell className="text-center tabular-nums">{holidayDays(h)}</TableCell>
                    <TableCell className="hidden md:table-cell">{h.academicYear}</TableCell>
                    <TableCell><Badge className={h.status === "Confirmed" ? "bg-green-100 text-green-700 border-0" : "bg-yellow-100 text-yellow-700 border-0"}>{h.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Button asChild variant="outline" size="icon"><Link href={`/holidays/${h.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                      <Button asChild variant="outline" size="icon"><Link href={`/holidays/${h.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                      <DeleteHolidayButton id={h.id} name={h.name} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {result.holidays.length} of {result.total} · page {result.page} of {result.totalPages}</span>
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
