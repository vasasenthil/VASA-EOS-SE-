import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getRegistrationDashboard, getActivityEvents, backboneConnected } from "./actions"
import { CreateEventForm, RegisterForm, WithdrawForm, CloseEventForm } from "./registration-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function EventRegistrationPage() {
  const connected = await backboneConnected()
  const d = await getRegistrationDashboard()
  const events = await getActivityEvents()
  const org = events[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Co-curricular Registration</PageHeaderHeading>
        <PageHeaderDescription>
          Seat-capped co-curricular events with fair allocation. The backbone confirms students up to the seat cap
          and <strong>waitlists</strong> the rest; when a confirmed student withdraws, the{" "}
          <strong>earliest waitlisted student is automatically promoted</strong> — a confirmed seat is never left
          empty while the waitlist is non-empty. Registration is blocked once the event is closed, and a student
          can register <strong>only once</strong> per event. Every button performs a real, persisted, audited
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
            control performs a real persisted operation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {!connected && <DemoDataNote />}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Events" value={d.events} />
            <Stat label="Confirmed" value={d.confirmed} />
            <Stat label="Waitlisted" value={d.waitlisted} />
            <Stat label="Seat fill %" value={d.fill_pct.toFixed(0)} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">seat-capped · FIFO waitlist · auto-promote</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Events</CardTitle>
              <CardDescription>{events.length} event(s) in scope. The bar shows confirmed seats vs capacity.</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events.</p>
              ) : (
                <div className="space-y-3">
                  {events.sort((a, b) => a.id.localeCompare(b.id)).map((e) => {
                    const confirmed = (e.registrations ?? []).filter((r) => r.state === "confirmed").length
                    const waitlisted = (e.registrations ?? []).filter((r) => r.state === "waitlisted").length
                    const pct = e.seat_cap > 0 ? Math.round((confirmed / e.seat_cap) * 100) : 0
                    return (
                      <div key={e.id} className="rounded-lg border p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs">{e.id}</span>
                          <span className="text-sm font-medium">{e.name}</span>
                          <Badge variant="outline">{e.category}</Badge>
                          <Badge variant={e.status === "open" ? "default" : "secondary"}>{e.status}</Badge>
                          {waitlisted > 0 && <Badge variant="secondary">{waitlisted} waitlisted</Badge>}
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <Progress value={pct} className="h-2 max-w-xs" />
                          <span className="text-xs tabular-nums text-muted-foreground">{confirmed}/{e.seat_cap} confirmed</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Open an event · register</CardTitle>
                <CardDescription>Open a seat-capped event, then register students (confirm or waitlist).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <CreateEventForm org={org} />
                <div className="border-t pt-4">
                  <RegisterForm />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Withdraw · close</CardTitle>
                <CardDescription>Withdraw frees a seat and auto-promotes the next waitlisted student.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <WithdrawForm />
                <div className="border-t pt-4">
                  <CloseEventForm />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}
