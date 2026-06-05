import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FEE_HEADS, FEE_LEDGER, balanceOf, statusOf, feeSummary, inr, type FeeStatus } from "@/lib/fees"

const STATUS_VARIANT: Record<FeeStatus, "default" | "secondary" | "destructive"> = {
  paid: "default",
  partial: "secondary",
  due: "destructive",
}

export default function FeesPage() {
  const s = feeSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Fee Management</PageHeaderHeading>
        <PageHeaderDescription>
          Fee heads, per-student ledger and collection status. Government schooling is largely fee-free; the small exam /
          library / lab / sports heads are tracked here with billed-vs-paid balances.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.students}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Billed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{inr(s.billed)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Collected</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.collectedPct}%</div><p className="text-xs text-muted-foreground mt-1">{inr(s.paid)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{inr(s.due)}</div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Fee heads</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {FEE_HEADS.map((h) => (
              <Badge key={h.code} variant="outline">{h.label}: {inr(h.amount)}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Student ledger</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Billed</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FEE_LEDGER.map((r) => (
                <TableRow key={r.apaarId}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.className}</TableCell>
                  <TableCell className="text-right">{inr(r.billed)}</TableCell>
                  <TableCell className="text-right">{inr(r.paid)}</TableCell>
                  <TableCell className="text-right">{inr(balanceOf(r))}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[statusOf(r)]}>{statusOf(r)}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}
