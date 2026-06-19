import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Scale, TrendingUp, AlertTriangle } from "lucide-react"
import { listOutcomes } from "@/lib/outcomes/store"
import { outcomeReport, indexByDimension, DIMENSIONS, type Dimension, type OpportunityGap } from "@/lib/outcomes"
import { SeedOutcomesButton } from "./seed-button"
import { isSupabaseAdminConfigured } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const DIM_LABEL: Record<Dimension, string> = {
  district: "District", schoolCategory: "School category", area: "Rural / Urban", gender: "Gender", socialCategory: "Social category", disability: "Disability (RPwD)",
}

function gapTone(gap: number): string {
  return gap <= 8 ? "text-green-700" : gap <= 16 ? "text-amber-700" : "text-red-700"
}

function GapCard({ g }: { g: OpportunityGap }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{DIM_LABEL[g.dimension]}</p>
        <p className={`mt-1 text-2xl font-bold ${gapTone(g.gap)}`}>{g.gap} pts</p>
        <p className="mt-1 text-xs text-muted-foreground">{g.highest.value} ({g.highest.index}) → {g.lowest.value} ({g.lowest.index})</p>
      </CardContent>
    </Card>
  )
}

export default async function OutcomesPage() {
  const records = await listOutcomes()
  const report = outcomeReport(records)
  const demo = !isSupabaseAdminConfigured()
  const disaggregations: Dimension[] = ["district", "schoolCategory", "area", "socialCategory", "gender", "disability"]

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>TN School Education Quality Index &amp; Opportunity-Gap</PageHeaderHeading>
        <PageHeaderDescription>One composite Quality Index (FLN · attendance · transition · pass), disaggregated by district, school category, rural/urban, gender, social category and disability — and an Opportunity-Gap Index that measures the spread between the best- and worst-served groups. The platform is judged on these outcomes, in public; the gap is the inequity to shrink under scrutiny.</PageHeaderDescription>
        <PageHeaderActions>
          <SeedOutcomesButton />
        </PageHeaderActions>
      </PageHeader>

      {demo ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Showing representative <strong>demo cohort outcomes</strong> — no database is configured. Provision Supabase and seed to compute live indices.
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_2fr]">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-indigo-600" />TN Quality Index</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{report.overall}<span className="text-lg text-muted-foreground">/100</span></div>
            <Progress value={report.overall} className="mt-2" />
            <p className="mt-2 text-xs text-muted-foreground">{report.cohort.toLocaleString("en-IN")} learners · {report.records} cohorts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Component metrics (cohort-weighted)</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {([["FLN attainment", report.metrics.flnPct], ["Attendance", report.metrics.attendancePct], ["Transition", report.metrics.transitionPct], ["Pass rate", report.metrics.passPct]] as const).map(([label, v]) => (
              <div key={label}><div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{v}%</span></div><Progress value={v} className="mt-1" /></div>
            ))}
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Scale className="h-5 w-5 text-indigo-600" />Opportunity-Gap Index</h2>
      {report.widestGap ? (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50/40 px-3 py-2 text-sm dark:bg-red-950/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span>Widest gap: <strong>{DIM_LABEL[report.widestGap.dimension]}</strong> — {report.widestGap.gap} points between {report.widestGap.highest.value} and {report.widestGap.lowest.value}. This is the headline inequity to shrink.</span>
        </div>
      ) : null}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {report.gaps.map((g) => <GapCard key={g.dimension} g={g} />)}
      </div>

      <h2 className="mb-3 text-lg font-semibold">Disaggregated Quality Index</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {disaggregations.map((dim) => (
          <Card key={dim}>
            <CardHeader><CardTitle className="text-base">By {DIM_LABEL[dim].toLowerCase()}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>{DIM_LABEL[dim]}</TableHead><TableHead className="text-right">Index</TableHead><TableHead className="text-right">Cohort</TableHead></TableRow></TableHeader>
                <TableBody>
                  {indexByDimension(records, dim).map((row) => (
                    <TableRow key={row.value}>
                      <TableCell className="font-medium">{row.value}</TableCell>
                      <TableCell className="text-right"><Badge className={`border-0 ${row.index >= 75 ? "bg-green-100 text-green-700" : row.index >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{row.index}</Badge></TableCell>
                      <TableCell className="text-right text-muted-foreground">{row.cohort.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{DIMENSIONS.length} disaggregation dimensions. Indices are cohort-size-weighted composites of FLN, attendance, transition and pass; every ingest is audit-anchored.</p>
    </Shell>
  )
}
