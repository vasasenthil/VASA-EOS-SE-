import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Download } from "lucide-react"
import { WELFARE_SERVICES, readiness, readinessBand, welfareSummary, type ReadinessBand } from "@/lib/governance/school-welfare-ops"

const BAND_VARIANT: Record<ReadinessBand, "default" | "secondary" | "outline"> = {
  good: "default",
  fair: "secondary",
  "needs-attention": "outline",
}

export default function SchoolWelfareOpsPage() {
  const s = welfareSummary()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Welfare Operations</PageHeaderHeading>
        <PageHeaderDescription>
          One readiness view of the daily welfare services a principal runs — library circulation and the mid-day meal
          (PM POSHAN). Each service&apos;s readiness is computed from its operational signals, with the module that owns
          it. Overall welfare readiness is <strong>{s.overallReadiness}%</strong>.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/governance/school-welfare-ops/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.services}</div><div className="text-sm text-muted-foreground">Welfare services</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.overallReadiness}%</div><div className="text-sm text-muted-foreground">Overall readiness</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-green-600 dark:text-green-500">{s.good}</div><div className="text-sm text-muted-foreground">Good</div></CardContent></Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {WELFARE_SERVICES.map((svc) => {
          const r = readiness(svc)
          return (
            <Card key={svc.key}>
              <CardContent className="pt-6">
                <div className="mb-2 flex items-center justify-between">
                  <a href={svc.route} className="font-medium hover:underline">{svc.name}</a>
                  <Badge variant={BAND_VARIANT[readinessBand(r)]}>{r}%</Badge>
                </div>
                <div className="space-y-2">
                  {svc.signals.map((sig) => (
                    <div key={sig.label}>
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>{sig.label}</span><span>{sig.pct}%</span></div>
                      <Progress value={sig.pct} />
                    </div>
                  ))}
                </div>
                <p className="mt-3 font-mono text-xs text-muted-foreground">{svc.moduleRef}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </Shell>
  )
}
