import Link from "next/link"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader, PageHeaderActions, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header"
import { Shell } from "@/components/shell"
import { getSession } from "@/lib/auth/session"
import { buildFunctionalCoverageReport, type FunctionalBuildStatus } from "@/lib/governance/functional-coverage"

export const dynamic = "force-dynamic"
const VARIANT: Record<FunctionalBuildStatus, "default" | "secondary" | "destructive"> = { "fully-built": "default", partial: "secondary", "yet-to-build": "destructive" }

export default async function FunctionalCoveragePage() {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!session.roles.some((role) => ["ADMIN", "SECRETARY", "DIRECTOR"].includes(role))) redirect("/unauthorized")
  const report = buildFunctionalCoverageReport()
  return <Shell>
    <PageHeader><PageHeaderHeading>Complete Functional Module Coverage</PageHeaderHeading><PageHeaderDescription>Canonical, no-omission status of all 391 CC-SPEC modules, reconciled with the legacy attachment crosswalk, role registers, previous portal deliveries and externally gated database work. Canonical Definition-of-Done status takes precedence over file existence.</PageHeaderDescription><PageHeaderActions><Button asChild><a href="/api/governance/functional-coverage/csv" download>Download all 391 modules</a></Button></PageHeaderActions></PageHeader>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[["Declared", report.canonical.declared], ["Listed", report.canonical.parsed], ["Fully built", report.canonical.fullyBuilt], ["Partial", report.canonical.partial], ["Yet to build", report.canonical.yetToBuild]].map(([label, value]) => <Card key={String(label)}><CardHeader className="pb-2"><CardDescription>{label}</CardDescription><CardTitle>{value}</CardTitle></CardHeader></Card>)}</div>
    <Card className="mt-6"><CardHeader><CardTitle>Source reconciliation</CardTitle><CardDescription>Contradictions are retained, not silently normalized.</CardDescription></CardHeader><CardContent className="space-y-2">{report.reconciliation.map((line) => <p key={line} className="rounded border p-3 text-sm">{line}</p>)}</CardContent></Card>
    <Card className="mt-6"><CardHeader><CardTitle>Previous delivery commitments</CardTitle></CardHeader><CardContent className="space-y-3">{report.deliveryCommitments.map((item) => <article key={item.id} className="rounded border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{item.name}</p><Badge variant={item.status === "fully-built" ? "default" : "secondary"}>{item.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{item.limitation}</p><div className="mt-2 flex flex-wrap gap-2">{item.evidence.map((path) => <code key={path} className="rounded bg-muted px-2 py-1 text-xs">{path}</code>)}</div></article>)}</CardContent></Card>
    <Card className="mt-6"><CardHeader><CardTitle>All canonical modules</CardTitle><CardDescription>{report.canonical.modules.length} IDs listed; use the CSV for machine processing.</CardDescription></CardHeader><CardContent className="space-y-2">{report.canonical.modules.map((module) => <article key={module.id} className="grid gap-2 rounded border p-3 md:grid-cols-[5rem_1fr_9rem_9rem]"><code className="text-xs">{module.id}</code><div><p className="text-sm font-medium">{module.name}</p><p className="text-xs text-muted-foreground">{module.domain} · {module.owner}{module.referenceSource ? ` · ${module.referenceSource}` : ""}</p></div><Badge className="w-fit" variant="outline">{module.canonicalStatus}</Badge><Badge className="w-fit" variant={VARIANT[module.status]}>{module.status}</Badge></article>)}</CardContent></Card>
    <Button asChild className="mt-6" variant="outline"><Link href="/governance/readiness">Open risk-ranked remediation backlog</Link></Button>
  </Shell>
}
