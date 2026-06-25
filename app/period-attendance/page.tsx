import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getPeriodDashboard, getPeriodSheet, backboneConnected } from "./actions"
import { MarkPeriodForm } from "./period-attendance-client"

export const dynamic = "force-dynamic"

const DATE = "2026-06-01"
const CLASS = "Grade 8-A"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function PeriodAttendancePage() {
  const connected = await backboneConnected()
  const d = await getPeriodDashboard()
  const sheet = await getPeriodSheet(CLASS, DATE)
  const org = sheet[0]?.org_unit ?? "33030004181"
  const teachers = Object.entries(d?.teacher_engagement ?? {}).sort((a, b) => b[1] - a[1])

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Period Attendance &amp; Lesson Delivery</PageHeaderHeading>
        <PageHeaderDescription>
          Record each class-period that was conducted — validated against the <strong>Class Timetable</strong>{" "}
          (you can&rsquo;t mark a period that isn&rsquo;t scheduled), with the subject and teacher{" "}
          <strong>snapshotted</strong> from the slot and the lesson actually taught linked to a{" "}
          <strong>published lesson plan</strong>. Day is derived from the date and start/end from the bell schedule.
          It yields <strong>subject-wise attendance</strong> and <strong>teacher engagement</strong> —
          complementary to the daily RTE attendance. Every button performs a real, persisted, audited operation.
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
            Mark-period button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {!connected && <DemoDataNote />}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Periods" value={d.periods} />
            <Stat label="Delivered" value={d.delivered} />
            <Stat label="Not held" value={d.not_held} />
            <Stat label="Present rate %" value={d.present_rate.toFixed(0)} />
            <div className="rounded-lg border p-4 sm:col-span-2">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">timetable-validated · plan-linked · durable</p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Subject-wise attendance</CardTitle>
                <CardDescription>Present vs possible across delivered periods, per subject.</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 pr-3 font-medium">Subject</th>
                      <th className="py-1 pr-3 font-medium">Periods</th>
                      <th className="py-1 pr-3 font-medium">Present</th>
                      <th className="py-1 font-medium">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(d.by_subject ?? []).sort((a, b) => a.subject.localeCompare(b.subject)).map((s) => (
                      <tr key={s.subject} className="border-t">
                        <td className="py-1 pr-3">{s.subject}</td>
                        <td className="py-1 pr-3 tabular-nums">{s.periods}</td>
                        <td className="py-1 pr-3 tabular-nums">{s.present}/{s.possible}</td>
                        <td className="py-1">
                          <Badge variant={s.present_pct < 75 ? "destructive" : "secondary"}>{s.present_pct.toFixed(0)}%</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Teacher engagement</CardTitle>
                <CardDescription>Periods actually delivered, per teacher.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y text-sm">
                  {teachers.map(([t, n]) => (
                    <li key={t} className="flex items-center justify-between gap-2 py-1.5">
                      <span className="font-mono">{t}</span>
                      <Badge variant="secondary">{n} periods</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Period sheet — {CLASS} · {DATE}</CardTitle>
              <CardDescription>{sheet.length} period(s) recorded.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {sheet.length === 0 ? (
                <p className="text-sm text-muted-foreground">No periods recorded.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 pr-3 font-medium">P</th>
                      <th className="py-1 pr-3 font-medium">Time</th>
                      <th className="py-1 pr-3 font-medium">Subject</th>
                      <th className="py-1 pr-3 font-medium">Teacher</th>
                      <th className="py-1 pr-3 font-medium">Present</th>
                      <th className="py-1 pr-3 font-medium">Plan</th>
                      <th className="py-1 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.sort((a, b) => a.period - b.period).map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="py-1 pr-3 tabular-nums">{r.period}</td>
                        <td className="py-1 pr-3 font-mono whitespace-nowrap">{r.start}–{r.end}</td>
                        <td className="py-1 pr-3">{r.subject}</td>
                        <td className="py-1 pr-3 font-mono">{r.teacher_id}</td>
                        <td className="py-1 pr-3 tabular-nums">{r.status === "not_held" ? "—" : `${r.present_count}/${r.strength}`}</td>
                        <td className="py-1 pr-3 font-mono text-muted-foreground">{r.lesson_plan_id || "—"}</td>
                        <td className="py-1">
                          <Badge variant={r.status === "not_held" ? "destructive" : "secondary"}>{r.status.replace("_", " ")}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mark a period</CardTitle>
              <CardDescription>Records a conducted (or not-held) class-period.</CardDescription>
            </CardHeader>
            <CardContent>
              <MarkPeriodForm org={org} date={DATE} />
            </CardContent>
          </Card>
        </div>
      )}
    </Shell>
  )
}
