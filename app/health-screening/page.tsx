import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getRbskDashboard, getReferralWorklist, backboneConnected } from "./actions"
import { ScreeningForm, ReferralActions } from "./health-screening-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

const STATUS_VARIANT: Record<string, "destructive" | "secondary" | "outline"> = {
  referred: "destructive",
  "under-treatment": "secondary",
}

export default async function HealthScreeningPage() {
  const connected = await backboneConnected()
  const d = await getRbskDashboard()
  const worklist = await getReferralWorklist()
  const org = worklist[0]?.org_unit ?? ""

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>RBSK Child-Health Screening</PageHeaderHeading>
        <PageHeaderDescription>
          Record Rashtriya Bal Swasthya Karyakram screenings against the durable backbone. A screening that flags
          any of the four Ds — defect · disease · deficiency · disability — <strong>automatically refers</strong>{" "}
          the child to the District Early Intervention Centre (DEIC). Each referral then walks the pipeline
          referred → under-treatment → closed (with an outcome). Every button performs a real, persisted, audited
          operation.
        </PageHeaderDescription>
      </PageHeader>

      {!d ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Backbone not connected</AlertTitle>
          <AlertDescription>
            This module drives the durable Go backbone (platformd + PostgreSQL). Run the full stack and set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">PLATFORM_URL</code> (e.g.{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">deploy/pilot/run-local.sh</code>), then every
            Record / Treat / Close button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {!connected && <DemoDataNote />}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Screened" value={d.screened} />
            <Stat label="Healthy" value={d.healthy} />
            <Stat label="With findings" value={d.with_findings} />
            <Stat label="Active referrals" value={d.active_referrals} />
            <Stat label="Closure %" value={(d.referral_closure_rate * 100).toFixed(0)} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">durable · audited</p>
            </div>
          </section>

          {Object.keys(d.by_finding).length > 0 && (
            <section className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Findings breakdown:</span>
              {Object.entries(d.by_finding).map(([f, n]) => (
                <Badge key={f} variant="outline" className="capitalize">{f} {n}</Badge>
              ))}
            </section>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Active referral worklist</CardTitle>
              <CardDescription>
                {worklist.length} child(ren) referred to the DEIC and awaiting treatment/closure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {worklist.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active referrals.</p>
              ) : (
                <ul className="divide-y">
                  {worklist.map((s) => (
                    <li key={s.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">{s.student_id}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {s.id} · screened {s.screened_on} · findings: {s.findings.join(", ") || "—"} · → {s.referred_to}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={STATUS_VARIANT[s.status] ?? "outline"} className="capitalize">{s.status}</Badge>
                        <ReferralActions id={s.id} status={s.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Record a screening</CardTitle>
              <CardDescription>Files a screening; any finding auto-refers the child to the DEIC.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScreeningForm org={org} />
            </CardContent>
          </Card>
        </div>
      )}
    </Shell>
  )
}
