import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { inr } from "@/lib/finance"
import { allocate, allocationSummary } from "@/lib/governance/resource-allocation"

export default function ResourceAllocationPage() {
  const s = allocationSummary()
  const rows = allocate()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Directorate Resource Allocation</PageHeaderHeading>
        <PageHeaderDescription>
          A directorate must split its envelope across districts — and &ldquo;equal&rdquo; is not &ldquo;equitable&rdquo;.
          This distributes the budget by a need-weighted formula (enrolment × need index), so a remote, high-need
          district draws more per child than a well-resourced city. The per-student funding ratio between the
          highest- and lowest-need districts is <strong>{s.progressivityRatio}×</strong> — visibly progressive.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/resource-allocation/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{inr(s.pool)}</div><div className="text-sm text-muted-foreground">Envelope (real budget)</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.districts}</div><div className="text-sm text-muted-foreground">Districts</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.totalEnrolment.toLocaleString("en-IN")}</div><div className="text-sm text-muted-foreground">Enrolment</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.progressivityRatio}×</div><div className="text-sm text-muted-foreground">Progressivity ratio</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>District</TableHead>
                <TableHead className="text-right">Schools</TableHead>
                <TableHead className="text-right">Enrolment</TableHead>
                <TableHead className="text-right">Need</TableHead>
                <TableHead className="text-right">Share</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
                <TableHead className="text-right">Per student</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.district}>
                  <TableCell className="font-medium">{r.district}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{r.schools}</TableCell>
                  <TableCell className="text-right">{r.enrolment.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{r.needIndex}</TableCell>
                  <TableCell className="text-right">{r.sharePct}%</TableCell>
                  <TableCell className="text-right">{inr(r.allocated)}</TableCell>
                  <TableCell className="text-right font-medium">{inr(r.perStudent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}
