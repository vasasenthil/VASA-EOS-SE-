import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { generateAnnualAiTransparencyReport, generateQuarterlyBiasAuditReport } from "@/lib/ai/transparency"

const STATUS_VARIANT = { pass: "outline", watch: "secondary", "action-required": "destructive" } as const
const REPORT_GENERATED_AT = "2026-07-21T00:00:00.000Z"
const REPORT_PERIOD = "2026-Q3"

export default function AiTransparencyPage() {
  const biasAudit = generateQuarterlyBiasAuditReport({ period: REPORT_PERIOD, generatedAt: REPORT_GENERATED_AT })
  const annual = generateAnnualAiTransparencyReport({ year: 2026, generatedAt: REPORT_GENERATED_AT, biasAudit })

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>AI Transparency 71.3 + Bias Audit 57.4/71.2</PageHeaderHeading>
        <PageHeaderDescription>
          Public, aggregate-only assurance surface for quarterly AI bias review and annual transparency reporting. It
          derives from the AI Register and publishes no child-level data, prompts or model input features.
        </PageHeaderDescription>
      </PageHeader>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Register entries</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{annual.registerSummary.entries}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">High-risk HITL</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{annual.biasAuditSummary.highRiskHumanReviewed}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Watch findings</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{annual.biasAuditSummary.watch}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Action required</CardTitle></CardHeader><CardContent><Badge variant={annual.biasAuditSummary.actionRequired ? "destructive" : "default"}>{annual.biasAuditSummary.actionRequired}</Badge></CardContent></Card>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm"><a href="/governance/ai-register">View AI Register 71.1</a></Button>
        <Button asChild variant="outline" size="sm"><a href="/api/governance/ai-transparency/bias-audit/csv" download>Download bias audit CSV</a></Button>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Annual public assurance — {annual.reportId}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {annual.publicAssurance.map((assurance) => <li key={assurance}>{assurance}</li>)}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {biasAudit.findings.map((finding) => (
          <Card key={finding.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{finding.registerEntryId}</CardTitle>
                  <p className="text-xs text-muted-foreground">Module {finding.moduleId} · {finding.protectedConstituency}</p>
                </div>
                <Badge variant={STATUS_VARIANT[finding.status]}>{finding.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{finding.evidence}</p>
              <p className="text-xs text-muted-foreground"><strong>Required action:</strong> {finding.requiredAction}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Shell>
  )
}
