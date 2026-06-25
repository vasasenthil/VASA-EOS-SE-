import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, CalendarClock } from "lucide-react"
import { listTimetableAction } from "./actions"
import { TimetableFilters } from "./components/timetable-filters"
import { DeleteTimetableButton } from "./components/delete-timetable-button"
import { SeedTimetableButton } from "./components/seed-timetable-button"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

interface SP { q?: string; class?: string; section?: string; day?: string; subject?: string; sort?: "day" | "period" | "createdAt"; page?: string }

export default async function TimetableManagerPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listTimetableAction({ query: sp.q, classLevel: sp.class, section: sp.section, day: sp.day, subject: sp.subject, sortBy: sp.sort ?? "day", sortDir: "asc", page })
  const demo = !isSupabaseAdminConfigured()

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, class: sp.class, section: sp.section, day: sp.day, subject: sp.subject, sort: sp.sort })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/timetable-manager?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Timetable Manager</PageHeaderHeading>
        <PageHeaderDescription>The durable per-period timetable — class, section, day, period, time, subject, teacher and room. Filter, search, create, edit and delete; a class or teacher can&apos;t be double-booked (clashes are rejected).</PageHeaderDescription>
        <PageHeaderActions>
          <SeedTimetableButton />
          <Button asChild><Link href="/timetable-manager/new"><PlusCircle className="mr-2 h-4 w-4" />New entry</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing a representative <strong>demo timetable</strong> — no database is configured. Provision Supabase and seed to manage live periods.
        </div>
      ) : null}

      <TimetableFilters />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead className="text-center">Period</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-center">Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="hidden md:table-cell">Teacher</TableHead>
                <TableHead className="hidden lg:table-cell">Room</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.entries.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground"><CalendarClock className="mx-auto mb-2 h-8 w-8" />No timetable entries found. Adjust filters, seed a demo timetable, or add a new period.</TableCell></TableRow>
              ) : (
                result.entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.day}</TableCell>
                    <TableCell className="text-center">{e.period}</TableCell>
                    <TableCell className="tabular-nums">{e.startTime}–{e.endTime}</TableCell>
                    <TableCell className="text-center">{e.classLevel}-{e.section}</TableCell>
                    <TableCell><Badge variant="outline">{e.subject}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell">{e.teacher}</TableCell>
                    <TableCell className="hidden lg:table-cell">{e.room}</TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Button asChild variant="outline" size="icon"><Link href={`/timetable-manager/${e.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                      <Button asChild variant="outline" size="icon"><Link href={`/timetable-manager/${e.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                      <DeleteTimetableButton id={e.id} label={`${e.day} P${e.period}`} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {result.entries.length} of {result.total} period{result.total === 1 ? "" : "s"} · page {result.page} of {result.totalPages}</span>
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
