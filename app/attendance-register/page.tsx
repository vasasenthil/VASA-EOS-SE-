import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Eye, Pencil, ArrowLeft, ArrowRight, CalendarCheck } from "lucide-react"
import { listAttendanceAction } from "./actions"
import { AttendanceFilters } from "./components/attendance-filters"
import { DeleteAttendanceButton } from "./components/delete-attendance-button"
import { SeedAttendanceButton } from "./components/seed-attendance-button"
import { type AttendanceStatus } from "@/lib/attendance-register"
import { safeDate } from "@/lib/format-date"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<AttendanceStatus, string> = {
  Present: "bg-green-100 text-green-700",
  Late: "bg-orange-100 text-orange-700",
  Absent: "bg-red-100 text-red-700",
  Leave: "bg-blue-100 text-blue-700",
}

interface SP { q?: string; status?: string; class?: string; section?: string; date?: string; sort?: "student" | "date" | "createdAt"; page?: string }

export default async function AttendanceRegisterPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1
  const result = await listAttendanceAction({ query: sp.q, status: sp.status, classLevel: sp.class, section: sp.section, date: sp.date, sortBy: sp.sort, sortDir: "desc", page })
  const demo = !isSupabaseAdminConfigured()

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, status: sp.status, class: sp.class, section: sp.section, date: sp.date, sort: sp.sort })) if (v) params.set(k, v as string)
    params.set("page", String(p))
    return `/attendance-register?${params.toString()}`
  }

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Attendance Register</PageHeaderHeading>
        <PageHeaderDescription>Durable per-student daily attendance — Present, Absent, Late or Leave, by class, section and date. Filter, search, create, edit and review the attendance rate.</PageHeaderDescription>
        <PageHeaderActions>
          <SeedAttendanceButton />
          <Button asChild><Link href="/attendance-register/new"><PlusCircle className="mr-2 h-4 w-4" />New entry</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing a representative <strong>demo register</strong> — no database is configured. Provision Supabase and seed to manage live attendance.
        </div>
      ) : null}

      <div className="mb-4 flex items-center gap-3 rounded-md border bg-muted/40 px-4 py-3 text-sm">
        <CalendarCheck className="h-5 w-5 text-muted-foreground" />
        <span>Attendance rate (current filter):</span>
        <Badge className="bg-green-100 text-green-700 border-0">{result.rate.pct}%</Badge>
        <span className="text-muted-foreground">{result.rate.attended} of {result.rate.total} attended (Present + Late)</span>
      </div>

      <AttendanceFilters />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="hidden lg:table-cell">APAAR</TableHead>
                <TableHead className="text-center">Class</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Remarks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.entries.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground"><CalendarCheck className="mx-auto mb-2 h-8 w-8" />No attendance entries found. Adjust filters, seed demo data, or add a new entry.</TableCell></TableRow>
              ) : (
                result.entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.student}</TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-xs">{e.apaarId || "—"}</TableCell>
                    <TableCell className="text-center">{e.classLevel}-{e.section}</TableCell>
                    <TableCell>{safeDate(e.date, "dd MMM yyyy")}</TableCell>
                    <TableCell><Badge className={`${STATUS_STYLE[e.status]} border-0`}>{e.status}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{e.remarks || "—"}</TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Button asChild variant="outline" size="icon"><Link href={`/attendance-register/${e.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                      <Button asChild variant="outline" size="icon"><Link href={`/attendance-register/${e.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                      <DeleteAttendanceButton id={e.id} student={e.student} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {result.entries.length} of {result.total} entr{result.total === 1 ? "y" : "ies"} · page {result.page} of {result.totalPages}</span>
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
