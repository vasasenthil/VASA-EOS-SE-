import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { getImmunisationDashboard, getSchedule, backboneConnected } from "./actions"
import { RecordDoseForm } from "./health-immunisation-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function HealthImmunisationPage() {
  const connected = await backboneConnected()
  const [d, schedule] = await Promise.all([getImmunisationDashboard(), getSchedule()])

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>School Health — Immunisation</PageHeaderHeading>
        <PageHeaderDescription>
          Record vaccine doses under the school-health schedule (UIP/RBSK) against the durable backbone. A dose can
          only be recorded in sequence (dose N requires doses 1…N-1), never off-schedule, never future-dated, and
          never a duplicate — all enforced server-side. Health data is sensitive: aggregate coverage is shown;
          the per-child worklist is for the governing officer.
        </PageHeaderDescription>
      </PageHeader>

      {!connected || !d ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Backbone not connected</AlertTitle>
          <AlertDescription>
            This module drives the durable Go backbone (platformd + PostgreSQL). Run the full stack and set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">PLATFORM_URL</code> (e.g.{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">deploy/pilot/run-local.sh</code>), then the
            Record-dose button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Students" value={d.students} />
            <Stat label="Doses recorded" value={d.doses_recorded} />
            <Stat label="Vaccines tracked" value={d.coverage.length} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">durable · audited</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Coverage by vaccine</CardTitle>
              <CardDescription>Complete / partial / due across the cohort in scope.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {d.coverage.map((c) => (
                  <li key={c.vaccine} className="flex items-center justify-between gap-2 py-2">
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">complete {c.complete} · partial {c.partial} · due {c.due}</p>
                    </div>
                    <Badge variant={c.coverage_pct >= 90 ? "default" : c.coverage_pct >= 50 ? "secondary" : "destructive"}>
                      {c.coverage_pct.toFixed(0)}%
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Record a dose</CardTitle>
                <CardDescription>Enforces the dose sequence and the schedule.</CardDescription>
              </CardHeader>
              <CardContent>
                <RecordDoseForm schedule={schedule} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Follow-up worklist (officer-only)</CardTitle>
                <CardDescription>{(d.worklist ?? []).length} child-vaccine gaps to follow up.</CardDescription>
              </CardHeader>
              <CardContent>
                {(d.worklist ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No gaps.</p>
                ) : (
                  <ul className="divide-y text-sm">
                    {(d.worklist ?? []).slice(0, 14).map((g, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 py-1.5">
                        <span>{g.student_id} · {g.vaccine}</span>
                        <Badge variant={g.status === "due" ? "destructive" : "secondary"}>{g.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}
