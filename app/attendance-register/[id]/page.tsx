import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil } from "lucide-react"
import { getAttendanceAction } from "../actions"
import { DeleteAttendanceButton } from "../components/delete-attendance-button"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

export default async function AttendanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const e = await getAttendanceAction(id)

  if (!e) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Attendance entry not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this attendance entry. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/attendance-register"><ArrowLeft className="mr-2 h-4 w-4" />Back to register</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const rows: Array<[string, string]> = [
    ["APAAR", e.apaarId || "—"],
    ["Class & section", `Class ${e.classLevel} — ${e.section}`],
    ["Date", safeDate(e.date, "dd MMM yyyy")],
    ["Status", e.status],
    ["Remarks", e.remarks || "—"],
    ["Recorded", safeDate(e.createdAt, "dd MMM yyyy")],
    ["Last updated", safeDate(e.updatedAt, "dd MMM yyyy")],
  ]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{e.student} — Attendance</PageHeaderHeading>
        <PageHeaderDescription>Class {e.classLevel}-{e.section} · {safeDate(e.date, "dd MMM yyyy")}</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/attendance-register/${e.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button>
          <DeleteAttendanceButton id={e.id} student={e.student} redirectTo="/attendance-register" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex items-center gap-3">
        <Button asChild variant="outline" size="sm"><Link href="/attendance-register"><ArrowLeft className="mr-2 h-4 w-4" />Back to register</Link></Button>
        <Badge>{e.status}</Badge>
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
