import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DemoDataNote } from "@/components/demo-data-note"
import { getInvigilationDashboard, getDutySessions, backboneConnected } from "./actions"
import { CreateSessionForm, AssignForm, UnassignForm, CloseSessionForm } from "./roster-client"

export const dynamic = "force-dynamic"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function InvigilationRosterPage() {
  const connected = await backboneConnected()
  const d = await getInvigilationDashboard()
  const sessions = await getDutySessions()
  const org = sessions[0]?.org_unit ?? "33030004181"

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Exam Invigilation Duty Roster</PageHeaderHeading>
        <PageHeaderDescription>
          The exam cell rosters invigilators onto sessions (hall · date · slot). The backbone enforces three hard
          rules: an invigilator <strong>cannot be on two sessions in the same date+slot</strong> (no clash), a
          session takes <strong>at most its required number</strong> (each person once), and a session can only be{" "}
          <strong>finalised when fully staffed</strong>. Every button performs a real, persisted, audited
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
            <Stat label="Sessions" value={d.sessions} />
            <Stat label="Seats filled" value={`${d.assigned_seats}/${d.required_seats}`} />
            <Stat label="Understaffed" value={d.understaffed?.length ?? 0} />
            <Stat label="Open" value={d.by_status?.open ?? 0} />
            <div className="rounded-lg border p-4">
              <Badge variant="outline" className="font-mono text-xs uppercase">live · {d.scope}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">no-clash · capacity · staffed-to-close</p>
            </div>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Exam sessions</CardTitle>
              <CardDescription>{sessions.length} session(s) in scope.</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions.</p>
              ) : (
                <div className="space-y-3">
                  {sessions.sort((a, b) => a.id.localeCompare(b.id)).map((s) => {
                    const assigned = s.invigilators?.length ?? 0
                    const full = assigned >= s.required_invigilators
                    return (
                      <div key={s.id} className="rounded-lg border p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs">{s.id}</span>
                          <span className="text-sm font-medium">{s.exam}</span>
                          <Badge variant="outline">{s.date} · {s.slot}</Badge>
                          <Badge variant="outline">{s.hall}</Badge>
                          <Badge variant={s.status === "closed" ? "secondary" : full ? "default" : "destructive"}>
                            {s.status === "closed" ? "finalised" : full ? "fully staffed" : `${assigned}/${s.required_invigilators}`}
                          </Badge>
                        </div>
                        {assigned > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1 text-xs text-muted-foreground">
                            {s.invigilators!.map((t) => (
                              <span key={t} className="rounded border px-2 py-0.5 font-mono">{t}</span>
                            ))}
                          </div>
                        )}
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
                <CardTitle className="text-base">Open a session · roster</CardTitle>
                <CardDescription>Open an exam session, then assign invigilators (no same-slot clash).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <CreateSessionForm org={org} />
                <div className="border-t pt-4">
                  <AssignForm />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Unassign · finalise</CardTitle>
                <CardDescription>Remove an invigilator, or finalise a fully-staffed session.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <UnassignForm />
                <div className="border-t pt-4">
                  <CloseSessionForm />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </Shell>
  )
}
