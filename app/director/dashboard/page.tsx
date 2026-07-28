import Link from "next/link"
import { redirect } from "next/navigation"
import { collectOversight } from "@/app/governance/oversight/collect"
import { DirectorAutoRefresh } from "@/components/director/auto-refresh"
import { PageHeader, PageHeaderActions, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header"
import { Shell } from "@/components/shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/auth/session"
import { buildDirectorateOperationsReport } from "@/lib/director/operations-centre"
import { stateRollup } from "@/lib/portal-data"

export const dynamic = "force-dynamic"
const SEVERITY = { critical: "destructive", high: "default", watch: "secondary" } as const

export default async function DirectorDashboardPage({ searchParams }: { searchParams: Promise<{ directorate?: string }> }) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!session.roles.some((role) => ["DIRECTOR", "ADMIN"].includes(role))) redirect("/unauthorized")
  const { directorate: requestedDirectorate } = await searchParams
  const report = buildDirectorateOperationsReport(stateRollup(), await collectOversight(), requestedDirectorate)
  const { directorate, state } = report
  const reportHref = `/api/director/operations-centre/report?directorate=${directorate.id}&format=csv`

  return <Shell>
    <PageHeader>
      <PageHeaderHeading>Directorate Operations Centre — {directorate.abbr}</PageHeaderHeading>
      <PageHeaderDescription>{directorate.mandate}. A human-authority workspace for execution, approvals, SLA intervention and statutory reporting across the seven directorates. State context and live workflow evidence are clearly separated.</PageHeaderDescription>
      <PageHeaderActions><Button asChild variant="outline"><a href={reportHref} download>Download operations report</a></Button><Button asChild><Link href={directorate.route}>Open specialised module</Link></Button></PageHeaderActions>
    </PageHeader>

    <div className="mb-4 flex flex-wrap gap-2" aria-label="Select directorate">{report.portfolio.map((item) => <Button key={item.id} asChild size="sm" variant={item.id === directorate.id ? "default" : "outline"}><Link href={`/director/dashboard?directorate=${item.id}`}>{item.abbr}</Link></Button>)}</div>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><DirectorAutoRefresh /><span className="text-xs text-muted-foreground">Server report: {new Date(report.generatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</span></div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        ["Awaiting Director authority", report.directorDecisions.length, "live workflow stores"],
        ["Directorate portfolio", report.portfolio.length, `${report.portfolio.filter((item) => item.status === "supported").length} fully supported`],
        ["District coverage", state.districts, `${state.schools} schools in state context`],
        ["Average attendance", `${state.avgAttendance}%`, `${state.atRisk} learner risk flags`],
        ["Quality index", state.avgQualityIndex, `${state.inspectionsDue} inspections prioritised`],
        ["Infrastructure readiness", `${state.infraReadiness}%`, `${state.mandatedGaps} mandated gaps`],
        ["Workflows in flight", report.workflows.inProgress, `${report.workflows.approved} approved · ${report.workflows.rejected} rejected`],
        ["Operational interventions", report.interventions.length, "deterministic human-action queue"],
      ].map(([label, value, detail]) => <Card key={String(label)}><CardHeader className="pb-2"><CardDescription>{label}</CardDescription><CardTitle className="text-2xl">{value}</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">{detail}</CardContent></Card>)}
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <Card><CardHeader><CardTitle>Director intervention queue</CardTitle><CardDescription>Rules-derived signals routed to accountable human decision surfaces.</CardDescription></CardHeader><CardContent className="space-y-3">{report.interventions.length === 0 ? <p className="text-sm text-muted-foreground">No threshold-based intervention is raised.</p> : report.interventions.map((item) => <div key={item.id} className="rounded-lg border p-4"><div className="flex items-center justify-between gap-2"><p className="font-medium">{item.title}</p><Badge variant={SEVERITY[item.severity]}>{item.severity}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{item.detail}</p><Button asChild variant="link" className="h-auto px-0 pt-2"><Link href={item.href}>Open action surface</Link></Button></div>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Workflow operations and SLA</CardTitle><CardDescription>Live cross-process workload, ranked by active files.</CardDescription></CardHeader><CardContent className="space-y-3">{report.workflowFlows.slice(0, 6).map((flow) => <div key={flow.flowId} className="flex items-center justify-between gap-3 rounded-md border p-3"><div><p className="font-medium">{flow.flowLabel}</p><p className="text-xs text-muted-foreground">{flow.approved} approved · {flow.rejected} rejected</p></div><Badge variant={flow.inProgress ? "default" : "secondary"}>{flow.inProgress} active</Badge></div>)}<div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{report.aging.map((row) => <div key={row.bucket} className="rounded-md bg-muted p-2 text-center"><p className="font-semibold">{row.count}</p><p className="text-xs text-muted-foreground">{row.bucket}</p></div>)}</div><Button asChild variant="outline"><Link href="/governance/oversight">Open oversight register</Link></Button></CardContent></Card>
    </div>

    <Card className="mt-6"><CardHeader><CardTitle>{directorate.abbr} end-to-end operating journey</CardTitle><CardDescription>Plan, resource, execute, inspect, intervene and report from one governed workspace.</CardDescription></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{[
      ["Specialised operations", directorate.route, directorate.focus], ["Decide", "/approvals", "Director approval inbox"], ["Plan", "/tracking/dashboard", "Policy implementation"], ["Resource", "/governance/resource-allocation", "Need-weighted allocation"],
      ["Workforce", "/governance/cadre-rationalisation", "Cadre and PTR"], ["Quality", "/quality", "Inspection and standards"], ["Schemes", "/schemes", "Implementation lifecycle"], ["Finance", "/budget-approvals", "Budget sanction workflow"],
      ["Procurement", "/procurement-approvals", "GeM tender approvals"], ["Infrastructure", "/works-approvals", "Works execution"], ["Risk", "/tracking/challenges", "Operational risk register"], ["Report", "/tracking/reports", "Analytics and benchmarking"],
    ].map(([label, href, detail]) => <Link key={`${label}-${href}`} href={href} className="rounded-lg border p-3 transition-colors hover:bg-muted"><p className="font-medium">{label}</p><p className="text-xs text-muted-foreground">{detail}</p></Link>)}</CardContent></Card>

    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <Card><CardHeader><CardTitle>Seven-directorate portfolio assurance</CardTitle></CardHeader><CardContent className="space-y-2">{report.portfolio.map((item) => <Link key={item.id} href={`/director/dashboard?directorate=${item.id}`} className="flex items-center justify-between gap-3 rounded-md border p-3 hover:bg-muted"><div><p className="font-medium">{item.abbr} · {item.name}</p><p className="text-xs text-muted-foreground">{item.focus}</p></div><Badge variant={item.status === "supported" ? "default" : "secondary"}>{item.status}</Badge></Link>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Evidence provenance</CardTitle><CardDescription>No synthetic directorate allocation and no reference data presented as real-time.</CardDescription></CardHeader><CardContent className="space-y-2">{report.evidence.map((item) => <div key={item.source} className="rounded-md border p-3"><div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{item.source}</span><Badge variant={item.mode === "live-store" ? "default" : "outline"}>{item.mode}</Badge></div><p className="mt-1 text-xs text-muted-foreground">Scope: {item.scope}</p></div>)}</CardContent></Card>
    </div>
  </Shell>
}
