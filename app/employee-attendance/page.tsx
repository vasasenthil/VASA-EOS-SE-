import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { getStaffDashboard, getStaffProfile, backboneConnected } from "./actions"
import { MarkStaffForm } from "./employee-attendance-client"

export const dynamic = "force-dynamic"

const DATE = "2026-06-01"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function EmployeeAttendancePage() {
  const connected = await backboneConnected()
  const d = await getStaffDashboard(DATE)
  const lwp = d?.lwp_staff ?? []
  // pull each LWP employee's payable/LWP profile (and discover the school org)
  const profiles = await Promise.all(lwp.map((e) => getStaffProfile(e)))
  const org = profiles.find((p) => p?.org_unit)?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Staff Attendance &amp; Payable Days</PageHeaderHeading>
        <PageHeaderDescription>
          Mark employee attendance against the durable backbone — payroll-grade. Marks are keyed by (employee,
          date), so correcting a day <strong>upserts</strong> rather than duplicates. The monthly profile computes{" "}
          <strong>payable days</strong> (present · on-duty · sanctioned leave = 1; half-day = 0.5) and flags{" "}
          <strong>leave-without-pay</strong> for unauthorised absence. Every button performs a real, persisted,
          audited operation.
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
            Mark-attendance button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Schools" value={d.schools} />
            <Stat label={`Marked (${d.date})`} value={d.marked_today} />
            <Stat label="Present rate %" value={d.present_rate.toFixed(0)} />
            <Stat label="On leave" value={d.on_leave} />
            <Stat label="LWP staff" value={lwp.length} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">durable · audited</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Leave-without-pay roster</CardTitle>
              <CardDescription>
                {lwp.length} employee(s) with one or more unauthorised absences — payable days reduced accordingly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lwp.length === 0 ? (
                <p className="text-sm text-muted-foreground">No LWP staff in scope.</p>
              ) : (
                <ul className="divide-y">
                  {lwp.map((e, i) => {
                    const p = profiles[i]
                    return (
                      <li key={e} className="flex items-center justify-between gap-2 py-2">
                        <span className="font-mono text-sm">{e}</span>
                        <div className="flex items-center gap-2 text-xs">
                          {p && <span className="text-muted-foreground">{p.payable_days} payable / {p.days_marked} days</span>}
                          <Badge variant="destructive">{p?.lwp_days ?? 0} LWP</Badge>
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
              <CardTitle className="text-base">Mark staff attendance</CardTitle>
              <CardDescription>Records or corrects an employee's mark for a date.</CardDescription>
            </CardHeader>
            <CardContent>
              <MarkStaffForm org={org} date={d.date} employees={lwp} />
            </CardContent>
          </Card>
        </div>
      )}
    </Shell>
  )
}
