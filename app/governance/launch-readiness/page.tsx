import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { READINESS_CRITERIA, READINESS_CATEGORIES, readinessByCategory, readinessSummary, type ReadinessStatus } from "@/lib/governance/launch-readiness"

const STATUS_VARIANT: Record<ReadinessStatus, "default" | "secondary" | "outline"> = {
  done: "default",
  partial: "secondary",
  "not-started": "outline",
}

export default function LaunchReadinessPage() {
  const s = readinessSummary()
  const cats = readinessByCategory()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Launch / Government Readiness</PageHeaderHeading>
        <PageHeaderDescription>
          The honest, unbiased scorecard for a state-wide government deployment — quantified and self-verifying. Each
          criterion is scored done / partial / not-started; done and partial cite in-repo evidence (verified to exist),
          and not-started cites nothing, so the register cannot inflate readiness. Overall weighted readiness is
          <strong> {s.overallReadinessPct}%</strong> ({s.done} done · {s.partial} partial · {s.notStarted} not-started).
          The truth this surfaces: a broad, well-tested MVP — <strong>not yet government-grade</strong>, because the
          largest gates (real data, live integrations, sovereign hosting, security/DPDP audit, scale testing) are
          organisational and infrastructural, not more code.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/launch-readiness/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((c) => (
          <Card key={c.category}>
            <CardContent className="py-4">
              <div className="flex items-baseline justify-between">
                <div className="text-sm font-medium">{c.category}</div>
                <div className="text-sm font-semibold">{c.readinessPct}%</div>
              </div>
              <Progress value={c.readinessPct} className="mt-2" />
              <div className="mt-1 text-xs text-muted-foreground">{c.done} done · {c.partial} partial · {c.notStarted} not-started</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {READINESS_CATEGORIES.map((cat) => (
        <Card key={cat} className="mb-4">
          <CardContent className="pt-6">
            <div className="mb-3 text-sm font-semibold">{cat}</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criterion</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Note / gap</TableHead>
                  <TableHead>Evidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {READINESS_CRITERIA.filter((c) => c.category === cat).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.criterion}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.note}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{c.evidenceRef || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </Shell>
  )
}
