import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Pencil } from "lucide-react"
import { getWorkTimeAction } from "../actions"
import { DeleteWorkTimeButton } from "../components/delete-worktime-button"
import { MonthResolver } from "../components/month-resolver"
import { instructionalMinutes, periodMinutes, WEEKDAYS, type PeriodKind } from "@/lib/worktime"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

const KIND_STYLE: Record<PeriodKind, string> = {
  Period: "bg-blue-100 text-blue-700",
  Break: "bg-amber-100 text-amber-700",
  Assembly: "bg-purple-100 text-purple-700",
}

export default async function WorkTimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getWorkTimeAction(id)

  if (!p) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Working-time profile not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this profile. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/work-schedule"><ArrowLeft className="mr-2 h-4 w-4" />Back to scheduler</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  // Default the resolver to the term-start month (or the first month within term).
  const startYear = Number(p.termStart.slice(0, 4))
  const startMonth = Number(p.termStart.slice(5, 7))

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{p.name}</PageHeaderHeading>
        <PageHeaderDescription>{p.academicYear} · {safeDate(p.termStart, "dd MMM yyyy")} – {safeDate(p.termEnd, "dd MMM yyyy")} · {instructionalMinutes(p.periods)} instructional min/day</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/work-schedule/${p.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button>
          <DeleteWorkTimeButton id={p.id} name={p.name} redirectTo="/work-schedule" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/work-schedule"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <Badge>{p.status}</Badge>
        {p.workingWeekdays.map((n) => <Badge key={n} variant="secondary">{WEEKDAYS[n]?.short}</Badge>)}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Daily bell schedule</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Slot</TableHead><TableHead>Kind</TableHead><TableHead>Time</TableHead><TableHead className="text-right">Min</TableHead></TableRow></TableHeader>
              <TableBody>
                {p.periods.map((bp, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{bp.label}</TableCell>
                    <TableCell><Badge className={`${KIND_STYLE[bp.kind]} border-0`}>{bp.kind}</Badge></TableCell>
                    <TableCell className="tabular-nums">{bp.startTime}–{bp.endTime}</TableCell>
                    <TableCell className="text-right tabular-nums">{periodMinutes(bp)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <MonthResolver profileId={p.id} initialYear={startYear} initialMonth={startMonth} />
      </div>
    </Shell>
  )
}
