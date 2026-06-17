import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil } from "lucide-react"
import { getTimetableEntryAction } from "../actions"
import { DeleteTimetableButton } from "../components/delete-timetable-button"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

export default async function TimetableDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const e = await getTimetableEntryAction(id)

  if (!e) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Timetable entry not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this timetable entry. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/timetable-manager"><ArrowLeft className="mr-2 h-4 w-4" />Back to timetable</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const rows: Array<[string, string]> = [
    ["Class & section", `Class ${e.classLevel} — ${e.section}`],
    ["Day", e.day],
    ["Period", String(e.period)],
    ["Time", `${e.startTime} – ${e.endTime}`],
    ["Subject", e.subject],
    ["Teacher", e.teacher],
    ["Room", e.room],
    ["Created", safeDate(e.createdAt, "dd MMM yyyy")],
    ["Last updated", safeDate(e.updatedAt, "dd MMM yyyy")],
  ]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{e.day}, Period {e.period} — {e.subject}</PageHeaderHeading>
        <PageHeaderDescription>Class {e.classLevel}-{e.section} · {e.startTime}–{e.endTime} · {e.room}</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/timetable-manager/${e.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button>
          <DeleteTimetableButton id={e.id} label={`${e.day} P${e.period}`} redirectTo="/timetable-manager" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex items-center gap-3">
        <Button asChild variant="outline" size="sm"><Link href="/timetable-manager"><ArrowLeft className="mr-2 h-4 w-4" />Back to timetable</Link></Button>
        <Badge>{e.teacher}</Badge>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </Shell>
  )
}
