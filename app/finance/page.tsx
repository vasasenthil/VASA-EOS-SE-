import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BUDGET, financeSummary, STATUTORY_REPORTS, inr } from "@/lib/finance"

export default function FinancePage() {
  const s = financeSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Financial Management</PageHeaderHeading>
        <PageHeaderDescription>
          Budget, grants, expenditure and receipts with IFHRMS/PFMS integration and CAG-ready statutory reporting — every
          rupee traceable to source, scheme and outcome.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Allocated</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{inr(s.allocated)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Spent</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{inr(s.spent)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Utilisation</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.utilisationPct}%</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Budget Heads</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Head</TableHead>
                  <TableHead className="text-right">Allocated</TableHead>
                  <TableHead className="w-40">Utilisation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {BUDGET.map((b) => {
                  const pct = Math.round((b.spent / b.allocated) * 100)
                  return (
                    <TableRow key={b.head}>
                      <TableCell className="font-medium">{b.head}</TableCell>
                      <TableCell className="text-right">{inr(b.allocated)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-2" />
                          <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Statutory Reports</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {STATUTORY_REPORTS.map((r) => (
                <li key={r.name} className="flex items-center justify-between gap-2">
                  <span>{r.name}</span>
                  <Badge variant="outline">{r.cadence}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}
