import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Pencil } from "lucide-react"
import { getReportCardAction } from "../actions"
import { DeleteReportCardButton } from "../components/delete-reportcard-button"
import { reportTotals, letterGrade } from "@/lib/reportcards"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

function pctOf(m: number, max: number): number {
  return max > 0 ? Math.round((m / max) * 1000) / 10 : 0
}

export default async function ReportCardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await getReportCardAction(id)

  if (!c) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Report card not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this report card. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/report-cards"><ArrowLeft className="mr-2 h-4 w-4" />Back to report cards</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const t = reportTotals(c.subjects)

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{c.student} — Report Card</PageHeaderHeading>
        <PageHeaderDescription>Class {c.classLevel} · {c.term} · {c.apaarId || "APAAR —"}</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/report-cards/${c.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button>
          <DeleteReportCardButton id={c.id} student={c.student} redirectTo="/report-cards" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex items-center gap-3">
        <Button asChild variant="outline" size="sm"><Link href="/report-cards"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <Badge>{c.status}</Badge>
        <Badge className={`${t.outcome === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} border-0`}>{t.outcome}</Badge>
      </div>

      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">Marksheet</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Subject</TableHead><TableHead className="text-right">Marks</TableHead><TableHead className="text-center">%</TableHead><TableHead className="text-center">Grade</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {c.subjects.map((s, i) => {
                const p = pctOf(s.marks, s.maxMarks)
                return (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{s.subject}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.marks}/{s.maxMarks}</TableCell>
                    <TableCell className="text-center tabular-nums">{p}%</TableCell>
                    <TableCell className="text-center"><Badge variant="outline">{letterGrade(p)}</Badge></TableCell>
                  </TableRow>
                )
              })}
              <TableRow className="font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums">{t.obtained}/{t.max}</TableCell>
                <TableCell className="text-center tabular-nums">{t.pct}%</TableCell>
                <TableCell className="text-center"><Badge>{t.grade}</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            {([
              ["Overall percentage", `${t.pct}%`],
              ["Overall grade", t.grade],
              ["Result", t.outcome],
              ["Attendance", `${c.attendancePct}%`],
              ["Remarks", c.remarks || "—"],
              ["Created", safeDate(c.createdAt, "dd MMM yyyy")],
              ["Last updated", safeDate(c.updatedAt, "dd MMM yyyy")],
            ] as Array<[string, string]>).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </Shell>
  )
}
