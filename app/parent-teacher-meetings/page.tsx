import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { getPtmDashboard, getSessionSheet, backboneConnected } from "./actions"
import { ScheduleForm, BookForm, AttendanceActions } from "./ptm-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function ParentTeacherMeetingsPage() {
  const connected = await backboneConnected()
  const d = await getPtmDashboard()
  const rollups = d?.sessions_rollup ?? []
  // discover the school org + a focus session from the rollup; show its live attendance sheet
  const focus = rollups[0]
  const sheet = focus ? await getSessionSheet(focus.session_id) : []
  const org = sheet[0]?.org_unit ?? ""

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Parent–Teacher Meetings</PageHeaderHeading>
        <PageHeaderDescription>
          Schedule meeting sessions, book guardians into slots, and mark attendance against the durable backbone.
          A session has a fixed number of slots — a guardian cannot double-book the same session and a full
          session cannot be overbooked; both invariants are enforced server-side. Fill and turnout are surfaced
          per session, with a low-turnout roster. Every button performs a real, persisted, audited operation.
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
            Schedule / Book / Attended / No-show button performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Sessions" value={d.sessions} />
            <Stat label="Total slots" value={d.total_slots} />
            <Stat label="Occupied" value={d.occupied} />
            <Stat label="Attended" value={d.attended} />
            <Stat label="Turnout %" value={d.turnout_pct.toFixed(0)} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">durable · audited</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sessions</CardTitle>
              <CardDescription>Fill (booked vs slots) and turnout (attended vs booked) per session.</CardDescription>
            </CardHeader>
            <CardContent>
              {rollups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions scheduled.</p>
              ) : (
                <ul className="divide-y">
                  {rollups.map((r) => (
                    <li key={r.session_id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">{r.title}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {r.session_id} · {r.date} · {r.booked}/{r.slots} booked · {r.attended} attended · {r.no_show} no-show
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">fill {r.fill_pct.toFixed(0)}%</Badge>
                        <Badge variant={r.turnout_pct < 50 ? "destructive" : "secondary"}>turnout {r.turnout_pct.toFixed(0)}%</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {focus && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Attendance sheet — {focus.title}</CardTitle>
                <CardDescription className="font-mono text-xs">{focus.session_id} · {sheet.length} booking(s)</CardDescription>
              </CardHeader>
              <CardContent>
                {sheet.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No bookings yet.</p>
                ) : (
                  <ul className="divide-y">
                    {sheet.map((b) => (
                      <li key={b.id} className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium">{b.guardian}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {b.student_id}{b.slot && <span> · {b.slot}</span>} · {b.status.replace("_", " ")}
                          </p>
                        </div>
                        <AttendanceActions bookingId={b.id} status={b.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Schedule a session</CardTitle>
                <CardDescription>Opens a new meeting with a fixed number of slots.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScheduleForm org={org} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Book a slot</CardTitle>
                <CardDescription>Reserves a slot for a guardian.</CardDescription>
              </CardHeader>
              <CardContent>
                <BookForm org={org} sessions={rollups.map((r) => ({ id: r.session_id, title: r.title }))} />
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}
