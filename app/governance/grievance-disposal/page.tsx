import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { disposalQueue, disposalSummary } from "@/lib/grievance/disposal"

// Fixed reference clock so the illustrative SLA computations render deterministically.
const NOW = new Date("2026-06-10T00:00:00Z")
const AS_OF = "10 Jun 2026"

export default function GrievanceDisposalPage() {
  const s = disposalSummary(NOW)
  const queue = disposalQueue(NOW)
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>State-tier Grievance Disposal</PageHeaderHeading>
        <PageHeaderDescription>
          Most grievances resolve at the school, block or district tier; those that escalate to the Secretariat land on
          the Secretary&apos;s desk. This is that disposal queue — Secretariat-tier grievances ordered most-urgent-first,
          each with an SLA-breach computation, so breaches surface before they age. {s.breached} of {s.pendingDisposal}
          {" "}pending grievances are past SLA <span className="text-muted-foreground">(as of {AS_OF})</span>.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/grievance-disposal/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.pendingDisposal}</div><div className="text-sm text-muted-foreground">Pending disposal</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-red-600 dark:text-red-500">{s.breached}</div><div className="text-sm text-muted-foreground">SLA breached</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.withinSla}</div><div className="text-sm text-muted-foreground">Within SLA</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.disposed}</div><div className="text-sm text-muted-foreground">Disposed</div></CardContent></Card>
      </div>

      {s.byCategory.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {s.byCategory.map((c) => (
            <Badge key={c.category} variant="secondary">{c.category}: {c.count}</Badge>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Grievance</TableHead>
                <TableHead className="text-right">SLA (h)</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>SLA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((d) => (
                <TableRow key={d.grievance.id}>
                  <TableCell className="font-mono text-xs">{d.grievance.id}</TableCell>
                  <TableCell className="text-muted-foreground">{d.grievance.category}</TableCell>
                  <TableCell className="text-sm">{d.grievance.description}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{d.grievance.slaHours}</TableCell>
                  <TableCell className="text-right">{d.remainingHours}h</TableCell>
                  <TableCell>
                    <Badge variant={d.breached ? "outline" : "default"} className={d.breached ? "border-red-500 text-red-600 dark:text-red-500" : ""}>
                      {d.breached ? "breached" : "within"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}
