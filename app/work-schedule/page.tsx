import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Eye, Pencil, CalendarRange } from "lucide-react"
import { listWorkTimeAction } from "./actions"
import { DeleteWorkTimeButton } from "./components/delete-worktime-button"
import { SeedWorkTimeButton } from "./components/seed-worktime-button"
import { instructionalMinutes, WEEKDAYS } from "@/lib/worktime"
import { safeDate } from "@/lib/format-date"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

function weekdayShort(days: number[]): string {
  return days.map((n) => WEEKDAYS[n]?.short ?? "?").join(" ")
}

export default async function WorkSchedulePage() {
  const result = await listWorkTimeAction({})
  const demo = !isSupabaseAdminConfigured()

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Working-Time Scheduler</PageHeaderHeading>
        <PageHeaderDescription>Per-academic-year working time — the term window, working weekdays and daily bell-schedule (periods, breaks, assembly). Combined with the Holiday Calendar it resolves real school days for the timetable and lesson plans.</PageHeaderDescription>
        <PageHeaderActions>
          <SeedWorkTimeButton />
          <Button asChild><Link href="/work-schedule/new"><PlusCircle className="mr-2 h-4 w-4" />New profile</Link></Button>
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing a representative <strong>demo working-time profile</strong> — no database is configured. Provision Supabase and seed to manage live profiles.
        </div>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profile</TableHead>
                <TableHead className="hidden md:table-cell">Year</TableHead>
                <TableHead className="hidden lg:table-cell">Term</TableHead>
                <TableHead className="hidden lg:table-cell">Working days</TableHead>
                <TableHead className="text-center">Instr. min/day</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.profiles.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground"><CalendarRange className="mx-auto mb-2 h-8 w-8" />No profiles found. Seed the demo profile or create a new one.</TableCell></TableRow>
              ) : (
                result.profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{p.academicYear}</TableCell>
                    <TableCell className="hidden lg:table-cell whitespace-nowrap">{safeDate(p.termStart, "dd MMM yy")} – {safeDate(p.termEnd, "dd MMM yy")}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">{weekdayShort(p.workingWeekdays)}</TableCell>
                    <TableCell className="text-center tabular-nums">{instructionalMinutes(p.periods)}</TableCell>
                    <TableCell><Badge className={p.status === "Active" ? "bg-green-100 text-green-700 border-0" : "bg-yellow-100 text-yellow-700 border-0"}>{p.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Button asChild variant="outline" size="icon"><Link href={`/work-schedule/${p.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                      <Button asChild variant="outline" size="icon"><Link href={`/work-schedule/${p.id}/edit`} aria-label="Edit"><Pencil className="h-4 w-4" /></Link></Button>
                      <DeleteWorkTimeButton id={p.id} name={p.name} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}
