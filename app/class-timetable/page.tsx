import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getTimetableDashboard, getTeacherSlots, getClassGrid, getSubstitutions, backboneConnected } from "./actions"
import { AssignSlotForm, AssignSubstitutionForm, CancelSubstitutionForm } from "./class-timetable-client"

export const dynamic = "force-dynamic"

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"]

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function ClassTimetablePage() {
  const connected = await backboneConnected()
  const d = await getTimetableDashboard()
  // discover the school org + seeded classes via a seeded teacher's slots
  const teachers = d ? Object.keys(d.teacher_load).sort() : []
  const probe = teachers.length ? await getTeacherSlots(teachers[0]) : []
  const org = probe[0]?.org_unit ?? ""
  const classes = Array.from(new Set(probe.map((s) => s.class))).sort()
  const grid = org && classes[0] ? await getClassGrid(org, classes[0]) : []
  const cell = (day: string, period: number) => grid.find((s) => s.day === day && s.period === period)
  const subs = await getSubstitutions("assigned")

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Class Timetable</PageHeaderHeading>
        <PageHeaderDescription>
          Assign class-slots (subject + teacher) against the durable backbone. A teacher can never be in two
          classes at the same day + period — the clash invariant is enforced server-side (in SQL) before each
          slot is saved. Per-teacher weekly load and overload signals are surfaced. Every button performs a real,
          persisted, audited operation.
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
            Assign-slot button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {!connected && <DemoDataNote />}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Slots" value={d.slots} />
            <Stat label="Classes" value={d.classes} />
            <Stat label="Teachers" value={d.teachers} />
            <Stat label="Overloaded" value={d.overloaded_teachers.length} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">durable · audited</p>
            </div>
          </section>

          {grid.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Weekly grid — {classes[0]}</CardTitle>
                <CardDescription className="font-mono text-xs">{org}</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="border p-1 text-left">Day \ P</th>
                      {[1, 2, 3, 4, 5, 6].map((p) => <th key={p} className="border p-1">{p}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day) => (
                      <tr key={day}>
                        <td className="border p-1 font-medium capitalize">{day}</td>
                        {[1, 2, 3, 4, 5, 6].map((p) => {
                          const s = cell(day, p)
                          return (
                            <td key={p} className="border p-1 text-center">
                              {s ? <span title={s.teacher_id}>{s.subject}<br /><span className="text-[10px] text-muted-foreground">{s.teacher_id}</span></span> : <span className="text-muted-foreground">—</span>}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assign a slot</CardTitle>
                <CardDescription>Set subject + teacher for a class period.</CardDescription>
              </CardHeader>
              <CardContent>
                <AssignSlotForm org={org} classes={classes} teachers={teachers} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Teacher weekly load</CardTitle>
                <CardDescription>Periods per week (overload {">"} 30).</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y text-sm">
                  {teachers.map((t) => (
                    <li key={t} className="flex items-center justify-between gap-2 py-1.5">
                      <span className="font-mono">{t}</span>
                      <Badge variant={d.overloaded_teachers.includes(t) ? "destructive" : "secondary"}>
                        {d.teacher_load[t]} periods
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Substitutions</CardTitle>
              <CardDescription>
                Date-specific substitute teachers for scheduled periods — the durable replacement of the former
                &ldquo;Timetable &amp; Substitution&rdquo; page. {subs.length} active.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subs.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-1 pr-3 font-medium">Id</th>
                        <th className="py-1 pr-3 font-medium">Date</th>
                        <th className="py-1 pr-3 font-medium">Class</th>
                        <th className="py-1 pr-3 font-medium">Period</th>
                        <th className="py-1 pr-3 font-medium">Subject</th>
                        <th className="py-1 font-medium">Regular → Substitute</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subs.sort((a, b) => a.id.localeCompare(b.id)).map((s) => (
                        <tr key={s.id} className="border-t">
                          <td className="py-1 pr-3 font-mono whitespace-nowrap">{s.id}</td>
                          <td className="py-1 pr-3 whitespace-nowrap">{s.date}</td>
                          <td className="py-1 pr-3">{s.class}</td>
                          <td className="py-1 pr-3">{s.day} P{s.period}</td>
                          <td className="py-1 pr-3">{s.subject}</td>
                          <td className="py-1 font-mono">{s.original_teacher} → {s.substitute_teacher}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="grid gap-6 lg:grid-cols-2">
                <AssignSubstitutionForm org={org || "33030004181"} />
                <CancelSubstitutionForm />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Shell>
  )
}
