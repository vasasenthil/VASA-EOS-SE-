import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createAuditAnchorProof } from "@/lib/audit/trail"
import { inr } from "@/lib/finance"
import { generateStatutoryReportPack } from "@/lib/finance/statutory-reports"

export default async function StatutoryReportsPage() {
  const anchor = await createAuditAnchorProof("2026-07-21T00:00:00.000Z")
  const pack = generateStatutoryReportPack({ fiscalYear: "2026-27", generatedAt: "2026-07-21T00:00:00.000Z", auditAnchorHash: anchor.anchorHash })

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Statutory Reports 66.3 + RTI Surface 66.4</PageHeaderHeading>
        <PageHeaderDescription>
          CAG-ready and RTI-ready aggregate disclosure pack. Public views exclude child-level data and link each budget
          head to the immutable audit anchor for officer review.
        </PageHeaderDescription>
      </PageHeader>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pack</CardTitle></CardHeader><CardContent className="font-mono text-sm">{pack.packId}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Allocated</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{inr(pack.totals.allocated)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Spent</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{inr(pack.totals.spent)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Audit anchor</CardTitle></CardHeader><CardContent className="break-all font-mono text-xs">{pack.auditAnchorHash}</CardContent></Card>
      </div>

      <div className="mb-4"><Button asChild variant="outline" size="sm"><a href="/api/governance/statutory-reports/csv" download>Download CSV</a></Button></div>

      <Card className="mb-4">
        <CardHeader><CardTitle>Public assurance</CardTitle></CardHeader>
        <CardContent><ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">{pack.publicAssurance.map((a) => <li key={a}>{a}</li>)}</ul></CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {pack.lines.map((line) => (
          <Card key={`${line.reportName}-${line.budgetHead}`}>
            <CardHeader className="pb-2"><CardTitle className="text-base">{line.reportName}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{line.budgetHead}</p>
              <div className="flex flex-wrap gap-2"><Badge variant="outline">Module {line.moduleId}</Badge><Badge variant="secondary">{line.cadence}</Badge><Badge>{line.utilisationPct}% used</Badge></div>
              <p className="text-xs text-muted-foreground">{line.evidence}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Shell>
  )
}
