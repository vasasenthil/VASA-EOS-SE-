import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, TrendingDown, Minus, ShieldCheck } from "lucide-react"
import { earlyWarningDashboardAction, listCasesAction } from "./actions"
import { EwsFilters } from "./components/ews-filters"
import { AtRiskTable } from "./components/at-risk-table"
import { CasesPanel } from "./components/cases-panel"

export const dynamic = "force-dynamic"

interface SP { q?: string; level?: string; class?: string }

export default async function EarlyWarningPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const [dash, cases] = await Promise.all([
    earlyWarningDashboardAction({ query: sp.q, level: sp.level, classLevel: sp.class }),
    listCasesAction(),
  ])
  const a = dash.cohort.analytics
  const TrendIcon = a.trend === "up" ? TrendingUp : a.trend === "down" ? TrendingDown : Minus

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Student Early-Warning System</PageHeaderHeading>
        <PageHeaderDescription>
          Native-AI in action: the Analytics Engine and a transparent risk model fuse signals from the
          Attendance Register, Student Fees and Report Cards to flag at-risk students — explainably. Every
          flag is <strong>advisory</strong>; a human opens, owns and resolves each case.
        </PageHeaderDescription>
      </PageHeader>

      {/* Engine output — Analytics Engine (Engine 5 of 6) */}
      <Card className="mb-4 border-indigo-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Brain className="h-4 w-4 text-indigo-600" />Analytics Engine — cohort attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary"><TrendIcon className="mr-1 h-3.5 w-3.5" />Trend {a.trend}</Badge>
            <Badge variant="secondary">mean {a.mean.toFixed(1)}%</Badge>
            <Badge variant="secondary">{a.anomalies.length} statistical outlier{a.anomalies.length === 1 ? "" : "s"}</Badge>
            <Badge variant="secondary">confidence {Math.round(a.confidence * 100)}%</Badge>
            <Badge className="bg-indigo-100 text-indigo-700 border-0"><ShieldCheck className="mr-1 h-3.5 w-3.5" />Human authority</Badge>
          </div>
          <p className="text-muted-foreground">{a.explanation}</p>
          {dash.cohort.outlierStudents.length > 0 ? (
            <p className="text-xs">Engine-flagged for a human look: <strong>{dash.cohort.outlierStudents.join(", ")}</strong></p>
          ) : null}
        </CardContent>
      </Card>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["At-risk reviewed", String(dash.summary.total), "text-foreground"],
          ["High risk", String(dash.summary.high), "text-red-700"],
          ["Medium risk", String(dash.summary.medium), "text-amber-700"],
          ["Open cases", String(cases.summary.open), cases.summary.open > 0 ? "text-red-700" : "text-foreground"],
        ].map(([label, value, color]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <EwsFilters />
      <AtRiskTable assessments={dash.assessments} />

      <div className="mt-6">
        <CasesPanel cases={cases.cases} />
      </div>
    </Shell>
  )
}
