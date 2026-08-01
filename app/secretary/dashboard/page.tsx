import Link from "next/link"
import { redirect } from "next/navigation"
import { collectOversight } from "@/app/governance/oversight/collect"
import { SecretaryAutoRefresh } from "@/components/secretary/auto-refresh"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader, PageHeaderActions, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header"
import { Shell } from "@/components/shell"
import { getSession } from "@/lib/auth/session"
import { stateRollup } from "@/lib/portal-data"
import { buildSecretaryCommandReport } from "@/lib/secretary/command-centre"

export const dynamic = "force-dynamic"

const SEVERITY = { critical: "destructive", high: "default", watch: "secondary" } as const

export default async function SecretaryDashboardPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!session.roles.some((role) => ["SECRETARY", "ADMIN"].includes(role))) redirect("/unauthorized")
  const report = buildSecretaryCommandReport(stateRollup(), await collectOversight())
  const { state, workflows } = report

  return <Shell>
    <PageHeader>
      <PageHeaderHeading>Secretary, School Education — State Command Centre</PageHeaderHeading>
      <PageHeaderDescription>State-wide visibility, policy-decision queues, workflow SLA oversight, safety, equity, learning and infrastructure evidence. Figures disclose their source mode and never imply a live state feed where only a reference register is available.</PageHeaderDescription>
      <PageHeaderActions><Button asChild variant="outline"><a href="/api/secretary/command-centre/report?format=csv" download>Download command report</a></Button></PageHeaderActions>
    </PageHeader>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><SecretaryAutoRefresh /><span className="text-xs text-muted-foreground">Server report: {new Date(report.generatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</span></div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        ["Students in evidence scope", state.students, `${state.districts} districts · ${state.schools} schools`],
        ["Average attendance", `${state.avgAttendance}%`, `${state.atRisk} learner risk flags`],
        ["NIPUN on track", `${state.nipunOnTrackPct}%`, `${state.schemeCoveragePct}% scheme coverage`],
        ["Quality index", state.avgQualityIndex, `${state.inspectionsDue} inspections prioritised`],
        ["Infrastructure readiness", `${state.infraReadiness}%`, `${state.mandatedGaps} mandated gaps`],
        ["Active safety incidents", state.activeIncidents, `${state.drillCompliant}/${state.schoolsTotal} drill compliant`],
        ["Decisions in flight", workflows.inProgress, `${workflows.approved} approved · ${workflows.rejected} rejected`],
        ["Priority interventions", report.priorities.length, "rules-derived command queue"],
      ].map(([label, value, hint]) => <Card key={String(label)}><CardHeader className="pb-2"><CardDescription>{label}</CardDescription><CardTitle className="text-2xl">{value}</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">{hint}</CardContent></Card>)}
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <Card><CardHeader><CardTitle>Policy and operational intervention queue</CardTitle><CardDescription>Deterministic escalation signals; every item routes to a human decision surface.</CardDescription></CardHeader><CardContent className="space-y-3">
        {report.priorities.length === 0 ? <p className="text-sm text-muted-foreground">No threshold-based intervention is currently raised.</p> : report.priorities.map((item) => <div key={item.id} className="rounded-lg border p-4"><div className="flex items-center justify-between gap-2"><p className="font-medium">{item.title}</p><Badge variant={SEVERITY[item.severity]}>{item.severity}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{item.detail}</p><Button asChild variant="link" className="h-auto px-0 pt-2"><Link href={item.href}>Open decision surface</Link></Button></div>)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Workflow accountability</CardTitle><CardDescription>Cross-process approvals grouped by accountable role and SLA age.</CardDescription></CardHeader><CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{report.pendingRoles.slice(0, 6).map((row) => <div key={row.role} className="rounded-md border p-3"><p className="font-mono text-xs">{row.role}</p><p className="text-xl font-semibold">{row.count}</p></div>)}</div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">{report.aging.map((row) => <div key={row.bucket} className="rounded-md bg-muted p-2 text-center"><p className="font-semibold">{row.count}</p><p className="text-xs text-muted-foreground">{row.bucket}</p></div>)}</div>
        <Button asChild className="mt-4" variant="outline"><Link href="/governance/oversight">Open full oversight register</Link></Button>
      </CardContent></Card>
    </div>

    <Card className="mt-6"><CardHeader><CardTitle>Secretary journey — decide, direct, assure and report</CardTitle></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {[
        ["Decide", "/approvals", "All approval workflows"], ["Policy", "/policies", "Policies and circulars"], ["Finance", "/budget-approvals", "Budget scrutiny and sanction"], ["Schemes", "/schemes", "Scheme lifecycle and impact"],
        ["Assembly", "/governance/assembly-briefing", "Assembly Q&A briefing"], ["Cabinet", "/governance/cabinet-note", "Cabinet-note preparation"], ["Risk", "/tracking/challenges", "State risk register"], ["Assure", "/governance/readiness", "Sovereign readiness backlog"],
        ["Fund flow", "/governance/fund-flow", "PFMS utilisation chain"], ["Grievance", "/governance/grievance-disposal", "State escalation disposal"], ["AI governance", "/governance/ai-register", "Model cards and authority"], ["Statutory", "/governance/statutory-reports", "Statutory reporting"],
      ].map(([label, href, detail]) => <Link key={href} href={href} className="rounded-lg border p-3 transition-colors hover:bg-muted"><p className="font-medium">{label}</p><p className="text-xs text-muted-foreground">{detail}</p></Link>)}
    </CardContent></Card>

    <Card className="mt-6"><CardHeader><CardTitle>Evidence provenance</CardTitle><CardDescription>Operational-grade dashboards separate durable live stores from bounded reference registers.</CardDescription></CardHeader><CardContent className="space-y-2">{report.evidence.map((item) => <div key={item.source} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"><span>{item.source}</span><Badge variant={item.mode === "live-store" ? "default" : "outline"}>{item.mode}</Badge></div>)}</CardContent></Card>
  </Shell>
}
