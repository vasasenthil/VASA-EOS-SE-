import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ENVIRONMENTAL, SOCIAL, GOVERNANCE, ESG_FRAMEWORKS, type EsgMetric } from "@/lib/esg"

function MetricList({ title, metrics }: { title: string; metrics: EsgMetric[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {metrics.map((m) => (
            <li key={m.label} className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{m.label}</span>
              <Badge variant="outline">{m.value}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default function GreenSchoolPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Green School &amp; ESG</PageHeaderHeading>
        <PageHeaderDescription>
          Environmental, Social and Governance performance for school operations — solar, water, waste and carbon
          tracking, equity and child-safety, transparent governance — reported against GRI, TCFD, SASB and SDG 4.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <MetricList title="Environmental" metrics={ENVIRONMENTAL} />
        <MetricList title="Social" metrics={SOCIAL} />
        <MetricList title="Governance" metrics={GOVERNANCE} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reporting Frameworks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ESG_FRAMEWORKS.map((f) => (
              <Badge key={f} variant="secondary">
                {f}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Shell>
  )
}
