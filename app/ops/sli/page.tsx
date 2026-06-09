import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { SLIS, sliSummary, errorBudgetLabel, type SliSource } from "@/lib/ops-posture/sli"
import { SLO_TARGETS } from "@/lib/ops-posture"

const SOURCE_VARIANT: Record<SliSource, "default" | "secondary" | "outline"> = {
  metric: "default",
  probe: "secondary",
  trace: "outline",
  ledger: "secondary",
}

function sloFor(service: string): string {
  return SLO_TARGETS.find((t) => t.service === service)?.target ?? "—"
}

export default function SliPage() {
  const s = sliSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Service-Level Indicators &amp; Error Budgets</PageHeaderHeading>
        <PageHeaderDescription>
          Each service-level objective bound to the indicator that measures it — what is observed, the measurement source
          (metric, probe, trace or the audit ledger) and the monthly error budget derived from the target. Verified 1:1
          against the SLO posture; computing these live needs the OTel collector and log pipeline at deploy.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/ops/sli/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.slis}</div><div className="text-sm text-muted-foreground">Service-level indicators</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.availabilitySlis}</div><div className="text-sm text-muted-foreground">Availability SLIs</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.tightestBudgetMinutes}<span className="text-base font-normal text-muted-foreground"> min/mo</span></div><div className="text-sm text-muted-foreground">Tightest error budget</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>SLO target</TableHead>
                <TableHead>Indicator</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Error budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SLIS.map((sli) => (
                <TableRow key={sli.service}>
                  <TableCell className="font-medium">{sli.service}<div className="text-xs font-mono text-muted-foreground">{sli.measurement}</div></TableCell>
                  <TableCell className="text-muted-foreground">{sloFor(sli.service)}</TableCell>
                  <TableCell className="text-muted-foreground">{sli.indicator}</TableCell>
                  <TableCell><Badge variant={SOURCE_VARIANT[sli.source]}>{sli.source}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{errorBudgetLabel(sli)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}
