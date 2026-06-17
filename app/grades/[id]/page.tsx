import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil } from "lucide-react"
import { getGradeAction } from "../actions"
import { DeleteGradeButton } from "../components/delete-grade-button"
import { percentage, letterGrade } from "@/lib/grades"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

export default async function GradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await getGradeAction(id)

  if (!g) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Grade not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this grade entry. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/grades"><ArrowLeft className="mr-2 h-4 w-4" />Back to gradebook</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const pct = percentage(g.marks, g.maxMarks)
  const rows: Array<[string, string]> = [
    ["Student", g.student],
    ["APAAR", g.apaarId || "—"],
    ["Class", `Class ${g.classLevel}`],
    ["Subject", g.subject],
    ["Term", g.term],
    ["Assessment", g.assessment],
    ["Marks", `${g.marks} / ${g.maxMarks}`],
    ["Percentage", `${pct}%`],
    ["Grade", letterGrade(pct)],
    ["Recorded", safeDate(g.createdAt, "dd MMM yyyy")],
    ["Last updated", safeDate(g.updatedAt, "dd MMM yyyy")],
  ]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{g.student} — {g.subject}</PageHeaderHeading>
        <PageHeaderDescription>{g.assessment} · {g.term} · {g.marks}/{g.maxMarks} ({pct}%, {letterGrade(pct)})</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/grades/${g.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button>
          <DeleteGradeButton id={g.id} student={g.student} redirectTo="/grades" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex items-center gap-3">
        <Button asChild variant="outline" size="sm"><Link href="/grades"><ArrowLeft className="mr-2 h-4 w-4" />Back to gradebook</Link></Button>
        <Badge>{g.status}</Badge>
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
