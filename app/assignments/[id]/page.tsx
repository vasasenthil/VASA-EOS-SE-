import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil } from "lucide-react"
import { getAssignmentAction } from "../actions"
import { DeleteAssignmentButton } from "../components/delete-assignment-button"
import { dueBand } from "@/lib/assignments"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

export default async function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const a = await getAssignmentAction(id)

  if (!a) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Assignment not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this assignment. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/assignments"><ArrowLeft className="mr-2 h-4 w-4" />Back to assignments</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const due = dueBand(a.dueDate, a.status)
  const rows: Array<[string, string]> = [
    ["Class", `Class ${a.classLevel}`],
    ["Subject", a.subject],
    ["Type", a.type],
    ["Due date", `${safeDate(a.dueDate, "dd MMM yyyy")}${due !== "—" ? ` (${due})` : ""}`],
    ["Max marks", String(a.maxMarks)],
    ["Teacher", a.teacher],
    ["Created", safeDate(a.createdAt, "dd MMM yyyy")],
    ["Last updated", safeDate(a.updatedAt, "dd MMM yyyy")],
  ]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{a.title}</PageHeaderHeading>
        <PageHeaderDescription>{a.instructions}</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/assignments/${a.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button>
          <DeleteAssignmentButton id={a.id} title={a.title} redirectTo="/assignments" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex items-center gap-3">
        <Button asChild variant="outline" size="sm"><Link href="/assignments"><ArrowLeft className="mr-2 h-4 w-4" />Back to assignments</Link></Button>
        <Badge>{a.status}</Badge>
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
