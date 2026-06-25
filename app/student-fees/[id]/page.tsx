import Link from "next/link"
import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Pencil, AlertTriangle } from "lucide-react"
import { getFeeAction } from "../actions"
import { DeleteFeeButton } from "../components/delete-fee-button"
import { feeGross, netDemand, totalPaid, balance, paymentStatus, isDefaulter, inr } from "@/lib/studentfees"
import { safeDate } from "@/lib/format-date"

export const dynamic = "force-dynamic"

export default async function FeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await getFeeAction(id)

  if (!r) {
    return (
      <Shell>
        <Card>
          <CardHeader><CardTitle>Fee record not found</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We couldn&apos;t find this fee record. It may have been removed.</p>
            <Button asChild variant="outline" size="sm"><Link href="/student-fees"><ArrowLeft className="mr-2 h-4 w-4" />Back to fees</Link></Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  const status = paymentStatus(r)
  const def = isDefaulter(r)
  const bal = balance(r)

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>{r.student} — Fee Statement</PageHeaderHeading>
        <PageHeaderDescription>Class {r.classLevel}-{r.section} · {r.academicYear} · due {safeDate(r.dueDate, "dd MMM yyyy")}</PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline"><Link href={`/student-fees/${r.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit / record receipt</Link></Button>
          <DeleteFeeButton id={r.id} student={r.student} redirectTo="/student-fees" />
        </PageHeaderActions>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link href="/student-fees"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
        <Badge className={status === "Paid" ? "bg-green-100 text-green-700 border-0" : status === "Partial" ? "bg-yellow-100 text-yellow-700 border-0" : "bg-red-100 text-red-700 border-0"}>{status}</Badge>
        {def ? <Badge className="bg-red-100 text-red-700 border-0"><AlertTriangle className="mr-1 h-3 w-3" />Defaulter</Badge> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Demand — fee heads</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Head</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {r.heads.map((h, i) => <TableRow key={i}><TableCell>{h.type}</TableCell><TableCell className="text-right tabular-nums">{inr(h.amount)}</TableCell></TableRow>)}
                <TableRow><TableCell className="text-muted-foreground">Gross</TableCell><TableCell className="text-right tabular-nums">{inr(feeGross(r.heads))}</TableCell></TableRow>
                {r.concessionAmount > 0 ? <TableRow><TableCell className="text-muted-foreground">Less: {r.concessionType}</TableCell><TableCell className="text-right tabular-nums text-green-700">– {inr(r.concessionAmount)}</TableCell></TableRow> : null}
                <TableRow className="font-semibold"><TableCell>Net demand</TableCell><TableCell className="text-right tabular-nums">{inr(netDemand(r))}</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Collection — receipts</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Mode</TableHead><TableHead>Reference</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {r.receipts.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No receipts recorded.</TableCell></TableRow>
                ) : r.receipts.map((rc, i) => (
                  <TableRow key={i}><TableCell>{safeDate(rc.date, "dd MMM yyyy")}</TableCell><TableCell>{rc.mode}</TableCell><TableCell className="font-mono text-xs">{rc.reference || "—"}</TableCell><TableCell className="text-right tabular-nums">{inr(rc.amount)}</TableCell></TableRow>
                ))}
                <TableRow className="font-semibold"><TableCell colSpan={3}>Total paid</TableCell><TableCell className="text-right tabular-nums">{inr(totalPaid(r.receipts))}</TableCell></TableRow>
                <TableRow className="font-semibold"><TableCell colSpan={3}>Balance</TableCell><TableCell className={`text-right tabular-nums ${bal > 0 ? "text-red-700" : "text-green-700"}`}>{inr(bal)}</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {(r.scholarshipScheme || r.dbtReference || r.notes) ? (
        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">DBT / scholarship & notes</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {r.scholarshipScheme ? <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Scholarship scheme</span><span className="font-medium">{r.scholarshipScheme}</span></div> : null}
            {r.dbtReference ? <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">DBT reference</span><span className="font-mono">{r.dbtReference}</span></div> : null}
            {r.notes ? <div className="flex justify-between py-2"><span className="text-muted-foreground">Notes</span><span>{r.notes}</span></div> : null}
          </CardContent>
        </Card>
      ) : null}
    </Shell>
  )
}
