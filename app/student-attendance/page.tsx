import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getAttendanceDashboard, getStudentAttendance, backboneConnected } from "./actions"
import { MarkForm } from "./student-attendance-client"

export const dynamic = "force-dynamic"

const DATE = "2026-06-10"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function StudentAttendancePage() {
  const connected = await backboneConnected()
  const d = await getAttendanceDashboard(DATE)
  const chronic = d?.chronic_absentees ?? []
  // pull each chronic absentee's profile (rate + days) and discover the school org
  const profiles = await Promise.all(chronic.map((s) => getStudentAttendance(s)))
  const org = profiles.find((p) => p?.org_unit)?.org_unit ?? d?.per_school[0]?.date ?? ""

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Student Attendance</PageHeaderHeading>
        <PageHeaderDescription>
          Mark daily attendance against the durable backbone and surface the RTE retention signal. Marks are keyed
          by (student, date), so correcting a day <strong>upserts</strong> rather than duplicates. A learner below
          the <strong>75%</strong> attendance floor over at least 10 attendable days is flagged a{" "}
          <strong>chronic absentee</strong>. Every button performs a real, persisted, audited operation.
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
            Mark-attendance button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {!connected && <DemoDataNote />}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Schools" value={d.schools} />
            <Stat label={`Marked (${d.date})`} value={d.marked} />
            <Stat label="Present rate %" value={d.overall_present_rate.toFixed(0)} />
            <Stat label="Chronic absentees" value={chronic.length} />
            <div className="rounded-lg border p-4 sm:col-span-2">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">RTE 75% floor · durable · audited</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Per-school roll-up — {d.date}</CardTitle>
              <CardDescription>Present/absent/late/excused split and present rate per school.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-1 pr-4 font-medium">School</th>
                    <th className="py-1 pr-4 font-medium">Marked</th>
                    <th className="py-1 pr-4 font-medium">Present</th>
                    <th className="py-1 pr-4 font-medium">Absent</th>
                    <th className="py-1 pr-4 font-medium">Late</th>
                    <th className="py-1 pr-4 font-medium">Excused</th>
                    <th className="py-1 pr-4 font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {d.per_school.map((s) => (
                    <tr key={s.date} className="border-t">
                      <td className="py-1 pr-4 font-mono text-xs">{s.date}</td>
                      <td className="py-1 pr-4 tabular-nums">{s.marked}</td>
                      <td className="py-1 pr-4 tabular-nums">{s.present}</td>
                      <td className="py-1 pr-4 tabular-nums">{s.absent}</td>
                      <td className="py-1 pr-4 tabular-nums">{s.late}</td>
                      <td className="py-1 pr-4 tabular-nums">{s.excused}</td>
                      <td className="py-1 pr-4 tabular-nums">{s.present_rate.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Chronic absentees</CardTitle>
              <CardDescription>
                {chronic.length} learner(s) below the 75% RTE floor — flag for retention/outreach follow-up.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chronic.length === 0 ? (
                <p className="text-sm text-muted-foreground">No chronic absentees in scope.</p>
              ) : (
                <ul className="divide-y">
                  {chronic.map((s, i) => {
                    const p = profiles[i]
                    return (
                      <li key={s} className="flex items-center justify-between gap-2 py-2">
                        <span className="font-mono text-sm">{s}</span>
                        <div className="flex items-center gap-2">
                          {p && <span className="text-xs text-muted-foreground">{p.days_recorded} days</span>}
                          <Badge variant="destructive">{(p?.attendance_rate ?? 0).toFixed(0)}%</Badge>
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
              <CardTitle className="text-base">Mark attendance</CardTitle>
              <CardDescription>Records or corrects a learner's mark for a date.</CardDescription>
            </CardHeader>
            <CardContent>
              <MarkForm org={org} date={d.date} students={chronic} />
            </CardContent>
          </Card>
        </div>
      )}
    </Shell>
  )
}
