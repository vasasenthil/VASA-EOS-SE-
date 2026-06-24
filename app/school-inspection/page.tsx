import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { getInspectionDashboard, backboneConnected } from "./actions"
import { FileInspectionForm, InspectionActions } from "./school-inspection-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  closed: "default",
  action_taken: "secondary",
  open: "outline",
}

export default async function SchoolInspectionPage() {
  const connected = await backboneConnected()
  const d = await getInspectionDashboard()
  const worklist = d?.open_worklist ?? []
  const low = d?.low_compliance ?? []
  const org = worklist[0]?.org_unit ?? low[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Inspection &amp; Monitoring</PageHeaderHeading>
        <PageHeaderDescription>
          A field officer records a monitoring visit — academic · administrative · safety · financial — scores the
          school&rsquo;s compliance, lists findings, and then walks each visit through an <strong>action → closure</strong>{" "}
          workflow against the durable backbone. A school cannot carry two open inspections of the same type, and a
          visit can be closed only after an action has been recorded against its findings. Every button performs a
          real, persisted, audited operation.
        </PageHeaderDescription>
      </PageHeader>

      {!connected || !d ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Backbone not connected</AlertTitle>
          <AlertDescription>
            This module drives the durable Go backbone (platformd + PostgreSQL). Run the full stack and set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">PLATFORM_URL</code> (e.g.{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">deploy/pilot/run-local.sh</code>), then every
            File / Record-action / Close button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Inspections" value={d.total} />
            <Stat label="Open" value={d.open} />
            <Stat label="Closed" value={d.by_status["closed"] ?? 0} />
            <Stat label="Avg compliance" value={d.avg_compliance.toFixed(0)} />
            <Stat label="Low (<60)" value={low.length} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">durable · audited</p>
            </div>
          </section>

          {Object.keys(d.by_type).length > 0 && (
            <section className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">By type:</span>
              {Object.entries(d.by_type).map(([t, n]) => (
                <Badge key={t} variant="outline" className="capitalize">{t} {n}</Badge>
              ))}
            </section>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Open inspection worklist</CardTitle>
              <CardDescription>
                {worklist.length} visit(s) awaiting action or closure. Record an action against the findings, then
                close once verified.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {worklist.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open inspections.</p>
              ) : (
                <ul className="divide-y">
                  {worklist.map((i) => (
                    <li key={i.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {i.type} · {i.org_unit}{" "}
                          <Badge variant={STATUS_VARIANT[i.status] ?? "outline"} className="ml-1">{i.status}</Badge>
                          {i.compliance_score < 60 && <Badge variant="destructive" className="ml-1">low {i.compliance_score}</Badge>}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {i.id} · {i.inspector_id} · visited {i.visited_on} · score {i.compliance_score}
                        </p>
                        {i.findings && <p className="mt-1 text-xs text-muted-foreground">{i.findings}</p>}
                      </div>
                      <InspectionActions id={i.id} status={i.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">File a monitoring visit</CardTitle>
              <CardDescription>Records a new inspection (status open) for the school.</CardDescription>
            </CardHeader>
            <CardContent>
              <FileInspectionForm org={org} />
            </CardContent>
          </Card>
        </div>
      )}
    </Shell>
  )
}
