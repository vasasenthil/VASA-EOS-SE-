import Link from "next/link"
import { redirect } from "next/navigation"
import { collectOversight } from "@/app/governance/oversight/collect"
import { DeoAutoRefresh } from "@/components/deo/auto-refresh"
import { PageHeader, PageHeaderActions, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header"
import { Shell } from "@/components/shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getSession } from "@/lib/auth/session"
import { buildDistrictOperationsReport } from "@/lib/deo/district-operations"

export const dynamic = "force-dynamic"
const HEAT = { critical: "bg-red-600 text-white", high: "bg-orange-500 text-white", watch: "bg-amber-200 text-amber-950", stable: "bg-emerald-100 text-emerald-900" }

export default async function DeoDashboardPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!session.roles.some((role) => ["DEO", "DISTRICT_EDUCATION_OFFICER", "CHIEF_EDUCATIONAL_OFFICER", "CEO_DISTRICT", "ADMIN"].includes(role))) redirect("/unauthorized")
  const districtId = session.tenant.districtId
  if (!districtId) redirect("/unauthorized")
  let report
  try { report = buildDistrictOperationsReport(districtId, await collectOversight()) } catch { redirect("/unauthorized") }

  return <Shell>
    <PageHeader><PageHeaderHeading>District Operations Centre — {report.districtName}</PageHeaderHeading><PageHeaderDescription>CEO/DEO command view for district KPIs, school and block heat signals, workflow SLA, compliance evidence and need-weighted resource prioritisation. Unknown evidence remains unknown rather than being fabricated.</PageHeaderDescription><PageHeaderActions><Button asChild variant="outline"><a href="/api/deo/district-operations/report?format=csv" download>Download district heat map</a></Button><Button asChild><Link href="/approvals">Open decision inbox</Link></Button></PageHeaderActions></PageHeader>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><DeoAutoRefresh /><span className="text-xs text-muted-foreground">Server report: {new Date(report.generatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST · jurisdiction {report.districtId}</span></div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      ["Schools in jurisdiction", report.totals.schools, `${report.totals.blocks} blocks`], ["District enrolment", report.totals.enrolment.toLocaleString("en-IN"), "school register"], ["Weighted attendance", `${report.totals.attendancePct}%`, "enrolment weighted"], ["Awaiting DEO", report.deoDecisions.length, "live decision view"],
      ["High-risk schools", report.totals.highRiskSchools, "heat-map threshold"], ["Quality evidence", `${report.totals.evidenceCoveragePct}%`, "linked register coverage"], ["Workflows active", report.workflows.inProgress, `${report.workflows.approved} approved`], ["Interventions", report.interventions.length, "human-action queue"],
    ].map(([label, value, detail]) => <Card key={String(label)}><CardHeader className="pb-2"><CardDescription>{label}</CardDescription><CardTitle className="text-2xl">{value}</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">{detail}</CardContent></Card>)}</div>

    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <Card><CardHeader><CardTitle>School performance heat map</CardTitle><CardDescription>Risk combines attendance and available quality evidence; colour is never inferred from missing quality data.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{report.schools.map((school) => <div key={school.schoolId} className={`rounded-lg p-4 ${HEAT[school.heat]}`}><div className="flex justify-between gap-2"><p className="font-semibold">{school.name}</p><Badge variant="outline" className="bg-white/80 text-black">{school.riskScore}</Badge></div><p className="mt-2 text-xs">Attendance {school.attendancePct}% · Quality {school.qualityIndex ?? "not linked"}</p><p className="text-xs">{school.blockId}</p></div>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>District intervention queue</CardTitle><CardDescription>Escalations route to accountable human workflows.</CardDescription></CardHeader><CardContent className="space-y-3">{report.interventions.map((item) => <Link key={item.id} href={item.href} className="block rounded-lg border p-3 hover:bg-muted"><div className="flex justify-between gap-2"><p className="font-medium">{item.title}</p><Badge variant={item.severity === "critical" ? "destructive" : item.severity === "high" ? "default" : "secondary"}>{item.severity}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></Link>)}<div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{report.aging.map((row) => <div key={row.bucket} className="rounded bg-muted p-2 text-center"><p className="font-semibold">{row.count}</p><p className="text-xs">{row.bucket}</p></div>)}</div></CardContent></Card>
    </div>

    <Card className="mt-6"><CardHeader><CardTitle>Need-weighted resource priority</CardTitle><CardDescription>Advisory share of the next discretionary envelope; enrolment is weighted by evidence-derived risk and still requires financial sanction.</CardDescription></CardHeader><CardContent className="space-y-4">{report.schools.map((school) => <div key={school.schoolId}><div className="mb-1 flex justify-between text-sm"><span>{school.name}</span><span>{school.prioritySharePct}%</span></div><Progress value={school.prioritySharePct} className="h-2" /></div>)}</CardContent></Card>

    <Card className="mt-6"><CardHeader><CardTitle>CEO/DEO end-to-end district journey</CardTitle></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{[
      ["Decide", "/approvals", "District approval inbox"], ["Inspect", "/quality", "Quality and compliance"], ["Recognise", "/recognition-approvals", "School recognition scrutiny"], ["Deploy", "/vacancy", "Teacher vacancy and deployment"],
      ["Resource", "/governance/resource-allocation", "Equitable allocation"], ["Works", "/works-approvals", "Infrastructure sanctions"], ["Protect", "/safety-incidents", "Child-safety incidents"], ["Resolve", "/grievance-approvals", "District grievances"],
      ["Support", "/health-referrals", "RBSK and DEIC referrals"], ["Scholarships", "/scholarship-approvals", "DBT sanctions"], ["Procure", "/procurement-approvals", "GeM financial scrutiny"], ["Report", "/tracking/reports", "District reporting"],
    ].map(([label, href, detail]) => <Link key={`${label}-${href}`} href={href} className="rounded-lg border p-3 hover:bg-muted"><p className="font-medium">{label}</p><p className="text-xs text-muted-foreground">{detail}</p></Link>)}</CardContent></Card>

    <Card className="mt-6"><CardHeader><CardTitle>Evidence provenance</CardTitle></CardHeader><CardContent className="space-y-2">{report.evidence.map((item) => <div key={item.source} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3"><div><p className="text-sm font-medium">{item.source}</p><p className="text-xs text-muted-foreground">{item.scope}</p></div><Badge variant={item.mode === "live-store" ? "default" : "outline"}>{item.mode}</Badge></div>)}</CardContent></Card>
  </Shell>
}
