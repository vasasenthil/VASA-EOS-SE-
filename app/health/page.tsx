import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { runSelfTests, type Check } from "@/lib/selftest"

function groupBy(checks: Check[]): Record<string, Check[]> {
  return checks.reduce<Record<string, Check[]>>((acc, c) => {
    ;(acc[c.group] ??= []).push(c)
    return acc
  }, {})
}

export default async function HealthPage() {
  const report = await runSelfTests()
  const groups = groupBy(report.checks)
  const allPass = report.failed === 0

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>System Self-Test &amp; Health</PageHeaderHeading>
        <PageHeaderDescription>
          Live verification of the platform&apos;s core guardrails — the access-control PDP (deny-wins, fail-closed),
          audit-chain integrity, assessment and knowledge-graph logic, and verifiable-credential tamper detection — run
          on demand against the running system, with persistence and integration posture reported alongside.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Overall</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{allPass ? "Healthy" : "Attention"}</div></CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Checks passed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{report.passed}/{report.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{report.failed}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Generated</CardTitle></CardHeader><CardContent><div className="text-sm font-mono">{report.generatedAt.slice(11, 19)} UTC</div></CardContent></Card>
      </div>

      <div className="space-y-4">
        {Object.entries(groups).map(([group, checks]) => (
          <Card key={group}>
            <CardHeader>
              <CardTitle className="text-base">{group}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {checks.map((c) => (
                  <li key={c.name} className="flex items-center justify-between gap-3 py-2">
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.detail}</div>
                    </div>
                    {c.info ? (
                      <Badge variant="secondary">info</Badge>
                    ) : c.pass ? (
                      <Badge>pass</Badge>
                    ) : (
                      <Badge variant="destructive">fail</Badge>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </Shell>
  )
}
