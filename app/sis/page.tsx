import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SIS_ROSTER, summarise } from "@/lib/sis"
import { SisExplorer } from "./sis-explorer"

export default function SisPage() {
  const s = summarise()

  const kpis = [
    { label: "Students", value: String(s.total) },
    { label: "Girls", value: String(s.girls) },
    { label: "CWSN (RPwD)", value: String(s.cwsn) },
    { label: "At-risk", value: String(s.atRisk) },
    { label: "Avg attendance", value: `${s.avgAttendance}%` },
  ]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Student Information System</PageHeaderHeading>
        <PageHeaderDescription>
          APAAR-anchored student records with a 360° view — lifecycle stage, attendance, NIPUN status, scheme
          participation, CWSN/IEP and predictive risk flags for early intervention.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5 mb-6">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SisExplorer students={SIS_ROSTER} />
    </Shell>
  )
}
