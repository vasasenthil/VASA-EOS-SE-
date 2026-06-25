import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { oversightQueue, oversightSummary, STATUTORY_DECISION_DAYS } from "@/lib/recognition/oversight"

// Fixed reference clock so the illustrative statutory-clock computations render deterministically.
const NOW = new Date("2026-06-10T00:00:00Z")
const AS_OF = "10 Jun 2026"

export default function RecognitionOversightPage() {
  const s = oversightSummary(NOW)
  const queue = oversightQueue(NOW)
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Recognition Oversight</PageHeaderHeading>
        <PageHeaderDescription>
          Recognition under the TN Recognised Private Schools Act 1973 is time-bound — an application undecided past the
          statutory {STATUTORY_DECISION_DAYS}-day window is itself a default by the State. The DEO decides; the Secretary
          oversees the pipeline and the clock. Every application in flight is shown with days elapsed, an eligibility-
          completeness score and overdue status, ordered longest-pending first. {s.overdue} of {s.inProgress} in-flight
          applications are past the statutory window <span className="text-muted-foreground">(as of {AS_OF})</span>.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/recognition-oversight/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.inProgress}</div><div className="text-sm text-muted-foreground">In flight</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-red-600 dark:text-red-500">{s.overdue}</div><div className="text-sm text-muted-foreground">Past statutory window</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.avgCompletenessPct}%</div><div className="text-sm text-muted-foreground">Avg eligibility met</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.recognised}</div><div className="text-sm text-muted-foreground">Recognised</div></CardContent></Card>
      </div>

      {s.byStage.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {s.byStage.map((x) => (
            <Badge key={x.stage} variant="secondary">{x.stage}: {x.count}</Badge>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>School</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Elapsed</TableHead>
                <TableHead className="text-right">Eligibility</TableHead>
                <TableHead>Clock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((o) => (
                <TableRow key={o.application.id}>
                  <TableCell className="font-mono text-xs">{o.application.id}</TableCell>
                  <TableCell className="font-medium">{o.application.school}</TableCell>
                  <TableCell className="text-muted-foreground">{o.application.district}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{o.stage}</TableCell>
                  <TableCell className="text-right">{o.elapsed}d</TableCell>
                  <TableCell className="text-right">{o.completeness}%</TableCell>
                  <TableCell>
                    <Badge variant={o.overdue ? "outline" : "default"} className={o.overdue ? "border-red-500 text-red-600 dark:text-red-500" : ""}>
                      {o.overdue ? "overdue" : "within"}
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
