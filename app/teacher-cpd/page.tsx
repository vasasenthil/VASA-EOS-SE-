import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getCpdDashboard, getTeacherCpd, backboneConnected } from "./actions"
import { RecordCpdForm } from "./teacher-cpd-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function TeacherCpdPage() {
  const connected = await backboneConnected()
  const d = await getCpdDashboard()
  const deficient = d?.deficient_teachers ?? []
  // pull each deficient teacher's profile to show hours-toward-target progress (+ discover the school org)
  const profiles = await Promise.all(deficient.map((t) => getTeacherCpd(t)))
  const org = profiles.find((p) => p?.org_unit)?.org_unit ?? (await getTeacherCpd("SYN-T-01"))?.org_unit ?? ""

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Teacher CPD — NEP-2020 Compliance</PageHeaderHeading>
        <PageHeaderDescription>
          Track continuous professional development against the durable backbone. NEP 2020 requires every teacher
          to complete <strong>50 hours</strong> of CPD per year — only <strong>completed</strong> or{" "}
          <strong>certified</strong> courses (from NISHTHA · SCERT · DIET · DIKSHA) count toward the target;
          enrolled courses are tracked but do not yet count. Compliance flips the moment a teacher crosses the
          50-hour line. Every button performs a real, persisted, audited operation.
        </PageHeaderDescription>
      </PageHeader>

      {!d ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Backbone not connected</AlertTitle>
          <AlertDescription>
            This module drives the durable Go backbone (platformd + PostgreSQL). Run the full stack and set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">PLATFORM_URL</code> (e.g.{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">deploy/pilot/run-local.sh</code>), then the
            Record-CPD button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {!connected && <DemoDataNote />}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Teachers" value={d.teachers} />
            <Stat label="Compliant" value={d.compliant} />
            <Stat label="Compliance %" value={d.compliance_rate.toFixed(0)} />
            <Stat label="Total hours" value={d.total_hours} />
            <Stat label="Deficient" value={deficient.length} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">{d.year} · durable · audited</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Deficient teachers</CardTitle>
              <CardDescription>
                {deficient.length} teacher(s) below the 50-hour NEP target this year — record their completed/
                certified courses to close the gap.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deficient.length === 0 ? (
                <p className="text-sm text-muted-foreground">All teachers are compliant. 🎉</p>
              ) : (
                <ul className="divide-y">
                  {deficient.map((t, i) => {
                    const p = profiles[i]
                    const hours = p?.hours ?? 0
                    const pct = Math.min(100, Math.round((hours / 50) * 100))
                    return (
                      <li key={t} className="py-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm">{t}</span>
                          <Badge variant="destructive">{hours}/50 h</Badge>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Record a CPD completion</CardTitle>
              <CardDescription>Logs a course; completed/certified hours count toward the 50-hour target.</CardDescription>
            </CardHeader>
            <CardContent>
              <RecordCpdForm org={org} teachers={deficient} />
            </CardContent>
          </Card>
        </div>
      )}
    </Shell>
  )
}
