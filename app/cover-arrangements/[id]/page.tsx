import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil, AlertTriangle, CheckCircle2 } from "lucide-react"
import { getCoverAction } from "../actions"
import { DeleteCoverButton } from "../components/cover-actions"
import { weekday, type CoverStatus } from "@/lib/coverflow"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<CoverStatus, string> = {
  Pending: "bg-red-100 text-red-700",
  Assigned: "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
}

export default async function CoverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await getCoverAction(id)

  if (!c) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Cover arrangement not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this cover arrangement. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/cover-arrangements"><ArrowLeft className="mr-2 h-4 w-4" />Back to arrangements</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const uncovered = !c.substituteTeacher.trim()
  const rows: Array<[string, string]> = [
    ["Date", `${safeDate(c.date, "dd MMM yyyy")}${weekday(c.date) ? ` · ${weekday(c.date)}` : ""}`],
    ["Absent teacher", c.absentTeacher],
    ["Reason", c.reason],
    ["Class & section", `Class ${c.classLevel} — ${c.section}`],
    ["Period", `Period ${c.period}`],
    ["Subject", c.subject],
    ["Substitute", c.substituteTeacher || "— not yet assigned —"],
    ["Last updated", safeDate(c.updatedAt, "dd MMM yyyy")],
  ]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{c.absentTeacher} · Period {c.period}</PageHeaderHeading>
        <PageHeaderDescription>Class {c.classLevel}-{c.section} · {c.subject} · {safeDate(c.date, "dd MMM yyyy")}</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/cover-arrangements/${c.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button>
          <DeleteCoverButton id={c.id} label={`${c.absentTeacher} P${c.period}`} redirectTo="/cover-arrangements" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/cover-arrangements"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <Badge className={`${STATUS_STYLE[c.status]} border-0`}>{c.status}</Badge>
        {uncovered ? <Badge className="bg-red-100 text-red-700 border-0"><AlertTriangle className="mr-1 h-3 w-3" />Uncovered — no substitute</Badge> : <Badge className="bg-green-100 text-green-700 border-0"><CheckCircle2 className="mr-1 h-3 w-3" />Covered by {c.substituteTeacher}</Badge>}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Arrangement</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-right">{v}</dd></div>
              ))}
            </dl>
            {c.notes ? <p className="mt-3 text-sm"><span className="text-muted-foreground">Notes: </span>{c.notes}</p> : null}
          </CardContent>
        </Card>
        <Card className={uncovered ? "border-red-200" : undefined}>
          <CardHeader><CardTitle className="text-base">Coverage status</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            {uncovered ? (
              <p className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 text-red-600 shrink-0" /><span>This period is still <strong>uncovered</strong>. Edit the arrangement and use <em>Suggest free teachers</em> to assign a substitute who is free in {weekday(c.date) || "that day"}, period {c.period}.</span></p>
            ) : (
              <p className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600 shrink-0" /><span><strong>{c.substituteTeacher}</strong> is covering this period{c.status === "Completed" ? " — marked completed." : "."}</span></p>
            )}
            <p className="text-xs text-muted-foreground">Substitute suggestions are read live from the Timetable Manager so a teacher already taking a class in this slot is never double-booked.</p>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}
