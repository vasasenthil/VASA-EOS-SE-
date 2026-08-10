import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AI_REGISTER, aiRegisterSummary } from "@/lib/ai/register"

const RISK_VARIANT = { low: "outline", medium: "secondary", high: "default" } as const

export default function AiRegisterPage() {
  const summary = aiRegisterSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>AI Register — Module 71.1</PageHeaderHeading>
        <PageHeaderDescription>
          Public, child-safe register of every AI engine and agent with a model-card summary. It publishes purpose,
          human authority and monitoring controls — never child-level data, prompts or features.
        </PageHeaderDescription>
      </PageHeader>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Entries</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{summary.entries}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Engines / Agents</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{summary.engines} / {summary.agents}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Human-review</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{summary.humanReview}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Charter aligned</CardTitle></CardHeader><CardContent><Badge variant={summary.charterAligned ? "default" : "destructive"}>{summary.charterAligned ? "yes" : "no"}</Badge></CardContent></Card>
      </div>

      <div className="mb-4">
        <Button asChild variant="outline" size="sm"><a href="/api/governance/ai-register/csv" download>Download CSV</a></Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {AI_REGISTER.map((entry) => (
          <Card key={entry.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{entry.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{entry.id} · {entry.protectedConstituency} · owner {entry.ownerTier}</p>
                </div>
                <Badge variant={RISK_VARIANT[entry.risk]}>{entry.risk}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{entry.publicModelCard.purpose}</p>
              <p className="text-xs text-muted-foreground"><strong>Human authority:</strong> {entry.publicModelCard.humanAuthority}</p>
              <p className="text-xs text-muted-foreground"><strong>Child safety:</strong> {entry.publicModelCard.childSafety}</p>
              <p className="text-xs text-muted-foreground"><strong>Monitoring:</strong> {entry.publicModelCard.monitoring}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Shell>
  )
}
